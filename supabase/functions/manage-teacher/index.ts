import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the calling user is an admin
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check admin role
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { email, password, full_name, teacher_id } = body;
      if (!email || !password || !full_name) {
        return new Response(JSON.stringify({ error: "Email, password, and name are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create user with admin API
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Assign teacher role
      await adminClient.from("user_roles").insert({
        user_id: newUser.user.id,
        role: "teacher",
      });

      // Update profile
      await adminClient.from("profiles").upsert({
        user_id: newUser.user.id,
        full_name,
        role: "teacher",
      }, { onConflict: "user_id" });

      // Link to teachers table if teacher_id provided
      if (teacher_id) {
        await adminClient.from("teachers").update({
          // We don't have a user_id column on teachers, so we just note it
        }).eq("id", teacher_id);
      }

      return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      // Get all users with teacher role
      const { data: teacherRoles } = await adminClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (!teacherRoles || teacherRoles.length === 0) {
        return new Response(JSON.stringify({ teachers: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userIds = teacherRoles.map((r: any) => r.user_id);
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("*")
        .in("user_id", userIds);

      // Get user emails from auth
      const teachers = [];
      for (const uid of userIds) {
        const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(uid);
        const profile = profiles?.find((p: any) => p.user_id === uid);
        teachers.push({
          user_id: uid,
          email: authUser?.email || "",
          full_name: profile?.full_name || "",
          created_at: authUser?.created_at || "",
        });
      }

      return new Response(JSON.stringify({ teachers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id: targetUserId } = body;
      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete role, profile, and auth user
      await adminClient.from("user_roles").delete().eq("user_id", targetUserId).eq("role", "teacher");
      await adminClient.from("profiles").delete().eq("user_id", targetUserId);
      await adminClient.auth.admin.deleteUser(targetUserId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset_password") {
      const { user_id: targetUserId, new_password } = body;
      if (!targetUserId || !new_password) {
        return new Response(JSON.stringify({ error: "user_id and new_password are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
        password: new_password,
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
