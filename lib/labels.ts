import { CollectionStatus, EnrollmentStatus, PaymentItemStatus } from '@/lib/domain';

export const paymentStatusLabel: Record<PaymentItemStatus, string> = {
  planned: 'Запланирован',
  partially_paid: 'Частично оплачен',
  paid: 'Оплачен',
  overdue: 'Просрочен'
};

export const collectionStatusLabel: Record<CollectionStatus, string> = {
  no_contact: 'Нет контакта',
  contacted: 'Связались',
  promise_to_pay: 'Обещал оплатить',
  refused: 'Отказ',
  closed: 'Закрыто'
};

export const enrollmentStatusLabel: Record<EnrollmentStatus, string> = {
  active: 'Активен',
  withdrawal_requested: 'Запрос на выбытие',
  withdrawn: 'Выбыл',
  re_enrolled: 'Повторно зачислен'
};
