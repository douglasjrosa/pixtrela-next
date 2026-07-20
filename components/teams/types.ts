export interface UserOption {
  documentId: string;
  name: string;
}

export interface TeamRow {
  documentId: string;
  name: string;
  exchangesFirstDay: number;
  exchangesLastDay: number;
  since: string | null;
  untill: string | null;
  leader?: UserOption | null;
  colaborators?: UserOption[];
}
