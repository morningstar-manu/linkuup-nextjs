export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'not-interested'
  | 'to-be-reminded'
  | 'longest-date';

export interface Appointment {
  _id: string;
  name: string;
  phone_1?: string;
  phone_2?: string;
  address?: string;
  date: string;
  time: string;
  commercial: string;
  status: AppointmentStatus;
  comment?: string;
  /** Date de rappel (YYYY-MM-DD) — visible quand status = 'to-be-reminded' */
  reminderDate?: string;
  createdAt?: string;
  userId?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
}

export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${h.toString().padStart(2, '0')}:30`);
  }
  return slots;
})();

export const SALES_REPRESENTATIVES = [
  'Annabelle Rodriguez',
  'Aurore Diallo',
  'Alassane Laye',
  'Benoît Chamboissier',
  'Didier Richard',
  'Emmanuel Domi',
  'Fatima Jabri',
  'Freddy Tamboers',
  'Helene Jehamo',
  'Julien Hendrickx',
  'Julien Camilleri',
  'Justine Dallas',
  'Julien Morel',
  'Loris Miran',
  'Karine Nobile',
  'Malcom Pichaud',
  'Mathieu Renault',
  'Manuel Romero',
  'Murphy Verger',
  'Romuald Vandenbussche',
  'Simon Cadenne',
  'Simon Ley',
  'Sylvie Delon',
  'Sophie Portal',
  'Sophie Rousmans',
  'Théo Raymond',
  'Vincent Le Mauff',
  'Yann Sieciechowicz',
] as const;
