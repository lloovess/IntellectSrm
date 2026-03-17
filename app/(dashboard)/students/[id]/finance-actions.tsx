'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CollectionStatus, EnrollmentStatus, PaymentItemStatus } from '@/lib/domain';
import { collectionStatusLabel, enrollmentStatusLabel, paymentStatusLabel } from '@/lib/labels';
import ActionStepShell from '@/components/preprod/action-step-shell';

type Props = {
  studentId: string;
  enrollmentId: string | null;
  contractId: string | null;
  paymentItemIds: string[];
  withdrawalId: string | null;
  workspace: 'assistant' | 'call_center' | 'finance_manager' | 'admin';
};

type BranchOption = { id: string; name: string };

export default function FinanceActions({ studentId, enrollmentId, contractId, paymentItemIds, withdrawalId, workspace }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [branches, setBranches] = useState<BranchOption[]>([]);

  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus>('active');
  const [paymentStatus, setPaymentStatus] = useState<PaymentItemStatus>('planned');
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus>('contacted');

  const [branchId, setBranchId] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [grade, setGrade] = useState('1');

  const [basePrice, setBasePrice] = useState('450000');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [prepaymentAmount, setPrepaymentAmount] = useState('50000');
  const [paymentMode, setPaymentMode] = useState<'one_time' | 'monthly'>('monthly');
  const [startedAt, setStartedAt] = useState(new Date().toISOString().slice(0, 10));

  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState('45000');
  const [paidAmount, setPaidAmount] = useState('0');

  const [paymentItemId, setPaymentItemId] = useState('');
  const [collectionNote, setCollectionNote] = useState('Связались, ожидаем оплату');

  const [withdrawReason, setWithdrawReason] = useState('Переезд');
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().slice(0, 10));
  const [withdrawType, setWithdrawType] = useState<'refund' | 'debt' | 'zero'>('debt');
  const [withdrawAmount, setWithdrawAmount] = useState('0');

  useEffect(() => {
    const run = async () => {
      const response = await fetch('/api/branches', { cache: 'no-store' });
      if (!response.ok) return;
      const payload = (await response.json()) as { data: BranchOption[] };
      setBranches(payload.data);
      if (payload.data.length > 0) setBranchId((prev) => prev || payload.data[0].id);
    };
    void run();
  }, []);

  const effectivePaymentItemId = useMemo(() => paymentItemId || paymentItemIds[0] || '', [paymentItemId, paymentItemIds]);
  const headers = useMemo(() => ({ 'Content-Type': 'application/json' }), []);
  const hasEnrollment = Boolean(enrollmentId);
  const hasContract = Boolean(contractId);
  const hasPaymentItem = Boolean(effectivePaymentItemId);
  const hasWithdrawal = Boolean(withdrawalId);

  const canManageEnrollment = workspace === 'assistant' || workspace === 'admin';
  const canManageContract = workspace === 'assistant' || workspace === 'finance_manager' || workspace === 'admin';
  const canManagePayment = workspace === 'assistant' || workspace === 'call_center' || workspace === 'finance_manager' || workspace === 'admin';
  const canRunCollections = workspace === 'call_center' || workspace === 'finance_manager' || workspace === 'admin';
  const canManageWithdrawal = workspace === 'finance_manager' || workspace === 'admin';
  const netContractAmount = Math.max(0, Number(basePrice || 0) - Number(discountAmount || 0));

  async function callApi(url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: object) {
    setMessage(null);
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage({ type: 'error', text: `Ошибка: ${payload.error ?? 'request failed'}` });
      return false;
    }

    setMessage({ type: 'ok', text: 'Изменения сохранены' });
    router.refresh();
    return true;
  }

  const createEnrollment = async (event: FormEvent) => {
    event.preventDefault();
    await callApi('/api/enrollments', 'POST', { studentId, branchId, academicYear, grade, status: enrollmentStatus });
  };

  const createContract = async (event: FormEvent) => {
    event.preventDefault();
    if (!enrollmentId) return setMessage({ type: 'error', text: 'Сначала создайте зачисление' });
    await callApi('/api/contracts', 'POST', {
      enrollmentId,
      basePrice: Number(basePrice),
      discountAmount: Number(discountAmount),
      prepaymentAmount: Number(prepaymentAmount),
      paymentMode,
      startedAt
    });
  };

  const updateContract = async () => {
    if (!contractId) return setMessage({ type: 'error', text: 'Нет договора для обновления' });
    await callApi(`/api/contracts/${contractId}`, 'PATCH', {
      basePrice: Number(basePrice),
      discountAmount: Number(discountAmount),
      prepaymentAmount: Number(prepaymentAmount),
      paymentMode,
      startedAt
    });
  };

  const removeContract = async () => {
    if (!contractId) return setMessage({ type: 'error', text: 'Нет договора для удаления' });
    await callApi(`/api/contracts/${contractId}`, 'DELETE');
  };

  const createPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!contractId) return setMessage({ type: 'error', text: 'Сначала создайте договор' });
    await callApi('/api/payment-items', 'POST', {
      contractId,
      dueDate,
      amount: Number(amount),
      paidAmount: Number(paidAmount),
      status: paymentStatus
    });
  };

  const updatePayment = async () => {
    if (!effectivePaymentItemId) return setMessage({ type: 'error', text: 'Нет платежа для обновления' });
    await callApi(`/api/payment-items/${effectivePaymentItemId}`, 'PATCH', {
      dueDate,
      amount: Number(amount),
      paidAmount: Number(paidAmount),
      status: paymentStatus
    });
  };

  const removePayment = async () => {
    if (!effectivePaymentItemId) return setMessage({ type: 'error', text: 'Нет платежа для удаления' });
    await callApi(`/api/payment-items/${effectivePaymentItemId}`, 'DELETE');
  };

  const upsertCollection = async (event: FormEvent) => {
    event.preventDefault();
    if (!effectivePaymentItemId) return setMessage({ type: 'error', text: 'Нет платежа для задачи взыскания' });
    await callApi('/api/collections', 'POST', {
      studentId,
      paymentItemId: effectivePaymentItemId,
      status: collectionStatus,
      note: collectionNote
    });
  };

  const createWithdrawal = async (event: FormEvent) => {
    event.preventDefault();
    if (!enrollmentId) return setMessage({ type: 'error', text: 'Сначала создайте зачисление' });
    await callApi('/api/withdrawals', 'POST', {
      enrollmentId,
      reason: withdrawReason,
      effectiveDate: withdrawDate,
      settlementType: withdrawType,
      settlementAmount: Number(withdrawAmount)
    });
  };

  const updateWithdrawal = async () => {
    if (!withdrawalId) return setMessage({ type: 'error', text: 'Нет кейса выбытия для обновления' });
    await callApi(`/api/withdrawals/${withdrawalId}`, 'PATCH', {
      reason: withdrawReason,
      effectiveDate: withdrawDate,
      settlementType: withdrawType,
      settlementAmount: Number(withdrawAmount)
    });
  };

  const removeWithdrawal = async () => {
    if (!withdrawalId) return setMessage({ type: 'error', text: 'Нет кейса выбытия для удаления' });
    await callApi(`/api/withdrawals/${withdrawalId}`, 'DELETE');
  };

  return (
    <section>
      <h2 className="section-title">Управление финансами ученика</h2>
      <p className="small" style={{ marginBottom: 10 }}>
        Заполняйте блоки по шагам: сначала зачисление, затем договор и график оплат.
      </p>

      {message ? (
        <div className="card" style={{ marginTop: 8, borderColor: message.type === 'error' ? '#fecaca' : '#99f6e4' }}>
          <p className="small" style={{ color: message.type === 'error' ? '#991b1b' : '#115e59' }}>
            {message.text}
          </p>
        </div>
      ) : null}

      {canManageEnrollment ? (
        <ActionStepShell
          title="1. Зачисление в филиал"
          hint={hasEnrollment ? 'Зачисление уже создано.' : 'Выберите филиал и класс, чтобы создать учебный профиль ученика.'}
        >
        <form onSubmit={createEnrollment}>
          <div className="form-grid" style={{ marginTop: 10 }}>
            <label>
              Филиал
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.length === 0 ? <option value="">Нет филиалов</option> : null}
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Учебный год
              <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2026-2027" />
            </label>
            <label>
              Класс
              <input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="1" />
            </label>
            <label>
              Статус
              <select value={enrollmentStatus} onChange={(e) => setEnrollmentStatus(e.target.value as EnrollmentStatus)}>
                <option value="active">{enrollmentStatusLabel.active}</option>
                <option value="withdrawal_requested">{enrollmentStatusLabel.withdrawal_requested}</option>
                <option value="withdrawn">{enrollmentStatusLabel.withdrawn}</option>
                <option value="re_enrolled">{enrollmentStatusLabel.re_enrolled}</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="primary" disabled={!branchId || hasEnrollment}>
              {hasEnrollment ? 'Зачисление уже есть' : 'Создать зачисление'}
            </button>
          </div>
        </form>
        </ActionStepShell>
      ) : null}

      {canManageContract ? (
        <ActionStepShell title="2. Договор и условия оплаты" hint={`К оплате после скидки: ${netContractAmount.toLocaleString('ru-RU')}`}>
        <form onSubmit={createContract}>
          <div className="form-grid" style={{ marginTop: 10 }}>
            <label>
              Базовая стоимость
              <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} />
            </label>
            <label>
              Скидка
              <input value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
            </label>
            <label>
              Предоплата
              <input value={prepaymentAmount} onChange={(e) => setPrepaymentAmount(e.target.value)} />
            </label>
            <label>
              Формат оплаты
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'one_time' | 'monthly')}>
                <option value="monthly">Ежемесячно</option>
                <option value="one_time">Разовый платеж</option>
              </select>
            </label>
            <label>
              Дата старта договора
              <input type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="primary" disabled={!hasEnrollment || hasContract}>
              {hasContract ? 'Договор уже создан' : 'Создать договор'}
            </button>
            <button type="button" onClick={() => void updateContract()} disabled={!hasContract}>
              Сохранить изменения
            </button>
            <button type="button" onClick={removeContract} disabled={!hasContract}>
              Удалить договор
            </button>
          </div>
        </form>
        </ActionStepShell>
      ) : null}

      {canManagePayment ? (
        <ActionStepShell title="3. График оплат">
        <form onSubmit={createPayment}>
          <div className="form-grid" style={{ marginTop: 10 }}>
            <label>
              Платеж для редактирования
              <select value={paymentItemId} onChange={(e) => setPaymentItemId(e.target.value)}>
                <option value="">Первый из списка</option>
                {paymentItemIds.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Срок оплаты
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
            <label>
              Сумма
              <input value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label>
              Оплачено
              <input value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
            </label>
            <label>
              Статус платежа
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentItemStatus)}>
                <option value="planned">{paymentStatusLabel.planned}</option>
                <option value="partially_paid">{paymentStatusLabel.partially_paid}</option>
                <option value="paid">{paymentStatusLabel.paid}</option>
                <option value="overdue">{paymentStatusLabel.overdue}</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="primary" disabled={!hasContract}>
              Добавить платеж
            </button>
            <button type="button" onClick={() => void updatePayment()} disabled={!hasPaymentItem}>
              Обновить платеж
            </button>
            <button type="button" onClick={removePayment} disabled={!hasPaymentItem}>
              Удалить платеж
            </button>
          </div>
        </form>
        </ActionStepShell>
      ) : null}

      {canRunCollections ? (
        <ActionStepShell title="4. Работа колл-центра (взыскание)">
        <form onSubmit={upsertCollection}>
          <div className="form-grid" style={{ marginTop: 10 }}>
            <label>
              Статус контакта
              <select value={collectionStatus} onChange={(e) => setCollectionStatus(e.target.value as CollectionStatus)}>
                <option value="no_contact">{collectionStatusLabel.no_contact}</option>
                <option value="contacted">{collectionStatusLabel.contacted}</option>
                <option value="promise_to_pay">{collectionStatusLabel.promise_to_pay}</option>
                <option value="refused">{collectionStatusLabel.refused}</option>
                <option value="closed">{collectionStatusLabel.closed}</option>
              </select>
            </label>
            <label className="wide">
              Комментарий оператора
              <input value={collectionNote} onChange={(e) => setCollectionNote(e.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="primary" disabled={!hasPaymentItem}>
              Сохранить задачу взыскания
            </button>
          </div>
        </form>
        </ActionStepShell>
      ) : null}

      {canManageWithdrawal ? (
        <ActionStepShell title="5. Выбытие ученика и перерасчет">
        <form onSubmit={createWithdrawal}>
          <div className="form-grid" style={{ marginTop: 10 }}>
            <label className="wide">
              Причина выбытия
              <input value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} />
            </label>
            <label>
              Дата выбытия
              <input type="date" value={withdrawDate} onChange={(e) => setWithdrawDate(e.target.value)} />
            </label>
            <label>
              Тип перерасчета
              <select value={withdrawType} onChange={(e) => setWithdrawType(e.target.value as 'refund' | 'debt' | 'zero')}>
                <option value="debt">Долг</option>
                <option value="refund">Возврат</option>
                <option value="zero">Без перерасчета</option>
              </select>
            </label>
            <label>
              Сумма перерасчета
              <input value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button type="submit" className="primary" disabled={!hasEnrollment || hasWithdrawal}>
              {hasWithdrawal ? 'Кейс выбытия уже создан' : 'Создать кейс выбытия'}
            </button>
            <button type="button" onClick={() => void updateWithdrawal()} disabled={!hasWithdrawal}>
              Сохранить изменения
            </button>
            <button type="button" onClick={removeWithdrawal} disabled={!hasWithdrawal}>
              Удалить кейс
            </button>
          </div>
        </form>
        </ActionStepShell>
      ) : null}

      {workspace === 'admin' ? (
        <div className="card" style={{ marginTop: 12 }}>
          <p className="small">Режим администратора: доступны все операционные блоки.</p>
        </div>
      ) : null}
    </section>
  );
}
