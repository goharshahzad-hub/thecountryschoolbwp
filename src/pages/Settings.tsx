import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpg";

const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage school information</p>
      </div>

      <div className="max-w-2xl space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">School Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <img src={logo} alt="School logo" className="h-16 w-16 rounded-full object-cover shadow-card" />
              <div>
                <p className="font-medium text-foreground">The Country School</p>
                <p className="text-sm text-muted-foreground">Model Town Fahad Campus, Bahawalpur</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input defaultValue="The Country School" />
              </div>
              <div className="space-y-2">
                <Label>Campus</Label>
                <Input defaultValue="Model Town Fahad Campus" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input defaultValue="Bahawalpur" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input defaultValue="+92 322 6107000" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input defaultValue="thecountryschoolbwp@gmail.com" />
              </div>
            </div>
            <Button className="gradient-primary text-primary-foreground">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
