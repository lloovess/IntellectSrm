import { Contract, NewContract } from "@/lib/db/schema/contracts";

export type { Contract, NewContract };

export type ContractStatus = 'active' | 'completed' | 'terminated';
