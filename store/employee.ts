import { employee } from "@prisma/client";
import { create } from "zustand";

export interface EmployeeWithRole extends Omit<employee, "password"> {
  password: string;
  position_name: string;
}

interface State {
  employee: EmployeeWithRole[];
  setEmployee: (categories: EmployeeWithRole[]) => void;
  clearEmployee: () => void;
}

export const useEmployeeStore = create<State>((set) => ({
  employee: [],
  setEmployee: (employee) => set({ employee }),
  clearEmployee: () => set({ employee: [] }),
}));
