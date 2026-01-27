import { useDemo } from "@/contexts/DemoContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Building2, User, FlaskConical } from "lucide-react";
import { useLocation } from "wouter";

const roleConfig = {
  sysadmin: {
    label: "SysAdmin",
    icon: Shield,
    color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    description: "Firmen & Kurse verwalten",
    defaultPath: "/admin",
  },
  companyadmin: {
    label: "FirmenAdmin",
    icon: Building2,
    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    description: "Mitarbeiter verwalten",
    defaultPath: "/company",
  },
  user: {
    label: "Mitarbeiter",
    icon: User,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    description: "Kurse absolvieren",
    defaultPath: "/dashboard",
  },
};

export default function DemoSwitcher() {
  const { demoMode, demoRole, setDemoRole } = useDemo();
  const [, setLocation] = useLocation();

  if (!demoMode) return null;

  const handleRoleChange = (value: string) => {
    const role = value as "sysadmin" | "companyadmin" | "user";
    setDemoRole(role);
    // Navigiere zur Standard-Seite der Rolle
    setLocation(roleConfig[role].defaultPath);
  };

  const currentRole = demoRole ? roleConfig[demoRole] : null;
  const Icon = currentRole?.icon || FlaskConical;

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
      <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1.5 py-1.5 px-3">
        <FlaskConical className="h-3.5 w-3.5" />
        Demo-Modus
      </Badge>
      
      <Select value={demoRole || undefined} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-[200px] bg-background/80 backdrop-blur border-white/10">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <SelectValue placeholder="Rolle wählen" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(roleConfig).map(([key, config]) => {
            const RoleIcon = config.icon;
            return (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <RoleIcon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs text-muted-foreground">{config.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
