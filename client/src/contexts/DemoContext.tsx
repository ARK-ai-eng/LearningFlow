import { createContext, useContext, useState, ReactNode } from "react";

type DemoRole = "sysadmin" | "companyadmin" | "user" | null;

interface DemoUser {
  id: number;
  openId: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  role: DemoRole;
  companyId: number | null;
  personnelNumber: string | null;
}

interface DemoContextType {
  demoMode: boolean;
  demoRole: DemoRole;
  demoUser: DemoUser | null;
  setDemoRole: (role: DemoRole) => void;
  toggleDemoMode: () => void;
}

const demoUsers: Record<NonNullable<DemoRole>, DemoUser> = {
  sysadmin: {
    id: 1,
    openId: "demo-sysadmin",
    email: "admin@aismarterflow.de",
    name: "Max Mustermann",
    firstName: "Max",
    lastName: "Mustermann",
    role: "sysadmin",
    companyId: null,
    personnelNumber: null,
  },
  companyadmin: {
    id: 2,
    openId: "demo-companyadmin",
    email: "firma@beispiel.de",
    name: "Anna Schmidt",
    firstName: "Anna",
    lastName: "Schmidt",
    role: "companyadmin",
    companyId: 1,
    personnelNumber: null,
  },
  user: {
    id: 3,
    openId: "demo-user",
    email: "mitarbeiter@beispiel.de",
    name: "Tom Weber",
    firstName: "Tom",
    lastName: "Weber",
    role: "user",
    companyId: 1,
    personnelNumber: "MA-001",
  },
};

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState(true); // Demo-Modus standardmäßig an
  const [demoRole, setDemoRoleState] = useState<DemoRole>("sysadmin");

  const setDemoRole = (role: DemoRole) => {
    setDemoRoleState(role);
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
  };

  const demoUser = demoRole ? demoUsers[demoRole] : null;

  return (
    <DemoContext.Provider
      value={{ demoMode, demoRole, demoUser, setDemoRole, toggleDemoMode }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
