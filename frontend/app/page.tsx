"use client";

import {
  Bath,
  BadgeCheck,
  Check,
  ChevronDown,
  CalendarOff,
  CookingPot,
  HelpCircle,
  Home,
  KeyRound,
  Leaf,
  LogOut,
  Plus,
  ReceiptText,
  RefreshCw,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ExpenseDialog } from "@/features/expenses/expense-dialog";
import { ExpensesView } from "@/features/expenses/expenses-view";
import { PaymentDialog } from "@/features/expenses/payment-dialog";
import { AbsencesView } from "@/features/absences/absences-view";
import { HomeView } from "@/features/home/home-view";
import { RulesView } from "@/features/rules/rules-view";
import { TutorialDialog } from "@/features/tutorial/tutorial-dialog";
import {
  getTutorialSteps,
  tutorialStorageKey,
} from "@/features/tutorial/tutorial-steps";
import { apiRequest } from "@/lib/api";
import {
  currentMonthValue,
  dateInputValue,
  formatShortDate,
  monthLabel,
  monthRange,
} from "@/lib/date";
import type {
  AppSection,
  AuthResponse,
  Balance,
  Absence,
  AbsenceDraft,
  Category,
  ChoreTask,
  ChoreWeek,
  ChoreWeekTask,
  CommonArea,
  Expense,
  ExpenseDraft,
  ExpensePaymentDraft,
  Member,
  MonthlySettlement,
  ParticipationRules,
  PreferenceDraft,
  Session,
  StoredData,
} from "@/lib/domain";
import { displayMemberName, memberName } from "@/lib/format";

const SESSION_KEY = "casa-viva-session";
const DATA_KEY = "casa-viva-data";

const defaultData: StoredData = {
  members: [],
  categories: [],
  areas: [],
  tasks: [],
};

const emptyRules: ParticipationRules = { preferences: [] };

export default function HomePage() {
  const [tab, setTab] = useState<AppSection>("home");
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<StoredData>(defaultData);
  const [week, setWeek] = useState<ChoreWeek | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [settlement, setSettlement] = useState<MonthlySettlement | null>(null);
  const [rules, setRules] = useState<ParticipationRules>(emptyRules);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [tutorialRunId, setTutorialRunId] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState(0);

  const weekStart = useMemo(() => currentMonday(), []);
  const loading = pendingActions > 0;
  const hasHousehold = Boolean(
    session?.householdId && session.currentMembershipId,
  );
  const canManageHouse = session?.role === "ADMIN";
  const currentBalance =
    balance?.members.find(
      (member) => member.membershipId === session?.currentMembershipId,
    )?.netBalance ?? 0;
  const tutorialSteps = useMemo(
    () => getTutorialSteps(session?.role),
    [session?.role],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSession(readStoredValue<Session | null>(SESSION_KEY, null));
      setData(readStoredValue<StoredData>(DATA_KEY, defaultData));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const run = useCallback(
    async (action: () => Promise<void>, options: { silent?: boolean } = {}) => {
      if (!options.silent) {
        setPendingActions((value) => value + 1);
        setMessage(null);
      }
      try {
        await action();
        return true;
      } catch (error) {
        if (!options.silent) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Ocurrió un error inesperado.",
          );
        }
        return false;
      } finally {
        if (!options.silent)
          setPendingActions((value) => Math.max(0, value - 1));
      }
    },
    [],
  );

  const persistData = useCallback((next: StoredData) => {
    setData(next);
    localStorage.setItem(DATA_KEY, JSON.stringify(next));
  }, []);

  const updateData = useCallback(
    (update: (current: StoredData) => StoredData) => {
      setData((current) => {
        const next = update(current);
        localStorage.setItem(DATA_KEY, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  const loadExpenseData = useCallback(
    async (activeSession: Session, month: string) => {
      const period = monthRange(month);
      const [expenseResult, balanceResult] = await Promise.all([
        apiRequest<{ expenses: Expense[] }>(
          `/api/v1/households/${activeSession.householdId}/expenses?from=${period.from}&to=${period.to}&limit=200`,
          { accessToken: activeSession.accessToken },
        ),
        apiRequest<Balance>(
          `/api/v1/households/${activeSession.householdId}/balance?from=${period.from}&to=${period.to}`,
          { accessToken: activeSession.accessToken },
        ),
      ]);
      setExpenses(expenseResult.expenses);
      setBalance(balanceResult);
    },
    [],
  );

  const loadAbsenceData = useCallback(
    async (activeSession: Session, month: string) => {
      const period = monthRange(month);
      const [absenceResult, settlementResult] = await Promise.all([
        apiRequest<{ absences: Absence[] }>(
          `/api/v1/households/${activeSession.householdId}/absences?from=${period.from}&to=${period.to}`,
          { accessToken: activeSession.accessToken },
        ),
        apiRequest<MonthlySettlement>(
          `/api/v1/households/${activeSession.householdId}/monthly-settlement?month=${month}`,
          { accessToken: activeSession.accessToken },
        ),
      ]);
      setAbsences(absenceResult.absences);
      setSettlement(settlementResult);
    },
    [],
  );

  const loadRules = useCallback(async (activeSession: Session) => {
    const result = await apiRequest<ParticipationRules>(
      `/api/v1/households/${activeSession.householdId}/participation-rules?on=${dateInputValue()}`,
      { accessToken: activeSession.accessToken },
    );
    setRules(result);
  }, []);

  const loadHouseholdData = useCallback(
    async (activeSession: Session) => {
      if (!activeSession.householdId || !activeSession.currentMembershipId)
        return;
      const [membersResult, categoriesResult, areasResult, tasksResult] =
        await Promise.allSettled([
          apiRequest<{ memberships: Member[] }>(
            `/api/v1/households/${activeSession.householdId}/memberships`,
            { accessToken: activeSession.accessToken },
          ),
          apiRequest<{ categories: Category[] }>(
            `/api/v1/households/${activeSession.householdId}/categories`,
            { accessToken: activeSession.accessToken },
          ),
          apiRequest<{ areas: CommonArea[] }>(
            `/api/v1/households/${activeSession.householdId}/common-areas`,
            { accessToken: activeSession.accessToken },
          ),
          apiRequest<{ tasks: ChoreTask[] }>(
            `/api/v1/households/${activeSession.householdId}/chores/tasks`,
            { accessToken: activeSession.accessToken },
          ),
        ]);
      persistData({
        members:
          membersResult.status === "fulfilled"
            ? membersResult.value.memberships
            : defaultData.members,
        categories:
          categoriesResult.status === "fulfilled"
            ? categoriesResult.value.categories
            : defaultData.categories,
        areas:
          areasResult.status === "fulfilled"
            ? areasResult.value.areas
            : defaultData.areas,
        tasks:
          tasksResult.status === "fulfilled"
            ? tasksResult.value.tasks
            : defaultData.tasks,
      });
    },
    [persistData],
  );

  const loadWeek = useCallback(
    async (activeSession: Session) => {
      try {
        const result = await apiRequest<ChoreWeek>(
          `/api/v1/households/${activeSession.householdId}/chores/weeks/${weekStart}`,
          { accessToken: activeSession.accessToken },
        );
        setWeek(result);
      } catch {
        setWeek(null);
      }
    },
    [weekStart],
  );

  useEffect(() => {
    if (!hasHousehold || !session) return;
    const timeout = window.setTimeout(() => {
      void run(() => loadHouseholdData(session), { silent: true });
      void run(() => loadRules(session), { silent: true });
      void run(() => loadWeek(session), { silent: true });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [hasHousehold, loadHouseholdData, loadRules, loadWeek, run, session]);

  useEffect(() => {
    if (!hasHousehold || !session) return;
    const timeout = window.setTimeout(() => {
      void run(() => loadExpenseData(session, selectedMonth), { silent: true });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [hasHousehold, loadExpenseData, run, selectedMonth, session]);

  useEffect(() => {
    if (!hasHousehold || !session) return;
    const timeout = window.setTimeout(() => {
      void run(() => loadAbsenceData(session, selectedMonth), { silent: true });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [hasHousehold, loadAbsenceData, run, selectedMonth, session]);

  useEffect(() => {
    if (!session?.householdId) return;
    const key = tutorialStorageKey(session.user.userId, session.householdId);
    if (localStorage.getItem(key)) return;
    const timeout = window.setTimeout(() => {
      setTutorialRunId((value) => value + 1);
      setTutorialOpen(true);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [session?.householdId, session?.user.userId]);

  const authenticate = async (
    event: FormEvent<HTMLFormElement>,
    mode: "login" | "register",
  ) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    if (!email || !password || (mode === "register" && !name)) return;
    await run(async () => {
      const result = await apiRequest<AuthResponse>(`/api/v1/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(
          mode === "register" ? { name, email, password } : { email, password },
        ),
      });
      const membership = result.memberships?.[0];
      const nextSession: Session = {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        currentUserName: result.user.name,
        ...(membership
          ? {
              householdId: membership.householdId,
              householdName: membership.householdName ?? "Casa",
              currentMembershipId: membership.membershipId,
              role: membership.role,
            }
          : {}),
      };
      setSession(nextSession);
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      persistData({ ...defaultData, members: membership ? [membership] : [] });
      setTab("home");
      setMessage(
        membership
          ? "Sesión iniciada."
          : "Crea una casa o entra con un código.",
      );
    });
  };

  const createHousehold = async (name: string) => {
    if (!session) return false;
    return run(async () => {
      const result = await apiRequest<{
        householdId: string;
        name: string;
        creatorMembershipId: string;
        inviteCode: string;
      }>("/api/v1/households", {
        method: "POST",
        accessToken: session.accessToken,
        body: JSON.stringify({ name, currency: "CLP", livingSince: dateInputValue() }),
      });
      const member: Member = {
        membershipId: result.creatorMembershipId,
        householdId: result.householdId,
        userId: session.user.userId,
        userName: session.user.name,
        role: "ADMIN",
        joinedAt: new Date().toISOString(),
        livingSince: dateInputValue(),
      };
      const nextSession: Session = {
        ...session,
        householdId: result.householdId,
        householdName: result.name,
        currentMembershipId: result.creatorMembershipId,
        role: "ADMIN",
        inviteCode: result.inviteCode,
      };
      setSession(nextSession);
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      persistData({ ...defaultData, members: [member] });
      setMessage("Casa creada.");
    });
  };

  const joinHousehold = async (inviteCode: string, livingSince: string) => {
    if (!session) return false;
    return run(async () => {
      const result = await apiRequest<{
        household: { householdId: string; name: string };
        membership: Member;
      }>("/api/v1/households/join", {
        method: "POST",
        accessToken: session.accessToken,
        body: JSON.stringify({ inviteCode, livingSince }),
      });
      const nextSession: Session = {
        ...session,
        householdId: result.household.householdId,
        householdName: result.household.name,
        currentMembershipId: result.membership.membershipId,
        role: result.membership.role,
        inviteCode: undefined,
      };
      setSession(nextSession);
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      persistData({ ...defaultData, members: [result.membership] });
      setMessage("Te uniste a la casa.");
    });
  };

  const createCategory = async (name: string) => {
    if (!hasHousehold || !session) return false;
    return run(async () => {
      const result = await apiRequest<Category>(
        `/api/v1/households/${session.householdId}/categories`,
        {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({
            name,
            createdByMembershipId: session.currentMembershipId,
          }),
        },
      );
      updateData((current) => ({
        ...current,
        categories: [...current.categories, result],
      }));
      setMessage("Categoría creada.");
    });
  };

  const createExpense = async (draft: ExpenseDraft) => {
    if (!hasHousehold || !session) return false;
    return run(async () => {
      await apiRequest(`/api/v1/households/${session.householdId}/expenses`, {
        method: "POST",
        accessToken: session.accessToken,
        body: JSON.stringify({
          ...draft,
          payerMembershipId: session.currentMembershipId,
          actorMembershipId: session.currentMembershipId,
          split: { mode: "AUTO_WEIGHTED" },
        }),
      });
      const expenseMonth = draft.date.slice(0, 7);
      if (expenseMonth !== selectedMonth) setSelectedMonth(expenseMonth);
      else await loadExpenseData(session, selectedMonth);
      setMessage("Gasto registrado.");
    });
  };

  const openPayment = (expense: Expense) => {
    setPaymentExpense(expense);
    setPaymentDialogOpen(true);
  };

  const closePayment = () => {
    setPaymentDialogOpen(false);
    setPaymentExpense(null);
  };

  const createPayment = async (draft: ExpensePaymentDraft) => {
    if (!hasHousehold || !session || !paymentExpense) return false;
    return run(async () => {
      await apiRequest(
        `/api/v1/households/${session.householdId}/expenses/${paymentExpense.expenseId}/payments`,
        {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({
            ...draft,
            createdByMembershipId: session.currentMembershipId,
          }),
        },
      );
      await loadExpenseData(session, selectedMonth);
      setMessage("Abono guardado.");
    });
  };

  const setPreference = async (draft: PreferenceDraft) => {
    if (!hasHousehold || !session) return false;
    return run(async () => {
      await apiRequest(
        `/api/v1/households/${session.householdId}/categories/${draft.categoryId}/preferences/${draft.membershipId}`,
        {
          method: "PUT",
          accessToken: session.accessToken,
          body: JSON.stringify({
            mode: draft.mode,
            ...(draft.weight ? { weight: draft.weight } : {}),
            validFrom: draft.validFrom,
            validTo: draft.validTo,
            changedByMembershipId: session.currentMembershipId,
          }),
        },
      );
      await loadRules(session);
      setMessage("Regla actualizada.");
    });
  };

  const createAbsence = async (draft: AbsenceDraft) => {
    if (!hasHousehold || !session) return false;
    return run(async () => {
      await apiRequest(
        `/api/v1/households/${session.householdId}/absences`,
        {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({
            ...draft,
            createdByMembershipId: session.currentMembershipId,
          }),
        },
      );
      await loadAbsenceData(session, selectedMonth);
      setMessage("Ausencia guardada.");
    });
  };

  const cancelAbsence = async (absenceId: string) => {
    if (!hasHousehold || !session) return false;
    return run(async () => {
      await apiRequest(
        `/api/v1/households/${session.householdId}/absences/${absenceId}/cancel`,
        {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({
            cancelledByMembershipId: session.currentMembershipId,
          }),
        },
      );
      await loadAbsenceData(session, selectedMonth);
      setMessage("Ausencia cancelada.");
    });
  };

  const createArea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasHousehold || !session) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    if (!name) return;
    const saved = await run(async () => {
      const result = await apiRequest<CommonArea>(
        `/api/v1/households/${session.householdId}/common-areas`,
        {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({
            name,
            createdByMembershipId: session.currentMembershipId,
          }),
        },
      );
      updateData((current) => ({
        ...current,
        areas: [...current.areas, result],
      }));
    });
    if (saved) event.currentTarget.reset();
  };

  const createTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasHousehold || !session || data.areas.length === 0) return;
    const form = new FormData(event.currentTarget);
    const body = {
      commonAreaId: String(form.get("commonAreaId")),
      name: String(form.get("name") ?? "").trim(),
      priority: Number(form.get("priority") ?? 1),
      assigneeLimit: Number(form.get("assigneeLimit") ?? 1),
      createdByMembershipId: session.currentMembershipId,
    };
    if (!body.name) return;
    const saved = await run(async () => {
      const result = await apiRequest<ChoreTask>(
        `/api/v1/households/${session.householdId}/chores/tasks`,
        {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify(body),
        },
      );
      updateData((current) => ({
        ...current,
        tasks: [...current.tasks, result],
      }));
    });
    if (saved) event.currentTarget.reset();
  };

  const generateWeek = async () => {
    if (!hasHousehold || !session) return;
    await run(async () => {
      const result = await apiRequest<ChoreWeek>(
        `/api/v1/households/${session.householdId}/chores/weeks`,
        {
          method: "POST",
          accessToken: session.accessToken,
          body: JSON.stringify({
            weekStart,
            createdByMembershipId: session.currentMembershipId,
          }),
        },
      );
      setWeek(result);
    });
  };

  const markAssignment = async (
    assignmentId: string,
    status: "DONE" | "NOT_DONE",
  ) => {
    if (!hasHousehold || !session) return;
    await run(async () => {
      await apiRequest(
        `/api/v1/households/${session.householdId}/chores/assignments/${assignmentId}`,
        {
          method: "PATCH",
          accessToken: session.accessToken,
          body: JSON.stringify({
            status,
            markedByMembershipId: session.currentMembershipId,
          }),
        },
      );
      await loadWeek(session);
    });
  };

  const regenerateInviteCode = async () => {
    if (!hasHousehold || !session) return;
    await run(async () => {
      const result = await apiRequest<{ inviteCode: string }>(
        `/api/v1/households/${session.householdId}/invite-code/regenerate`,
        { method: "POST", accessToken: session.accessToken },
      );
      const nextSession = { ...session, inviteCode: result.inviteCode };
      setSession(nextSession);
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setMessage("Código actualizado.");
    });
  };

  const resetSession = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DATA_KEY);
    setSession(null);
    setData(defaultData);
    setWeek(null);
    setExpenses([]);
    setBalance(null);
    setAbsences([]);
    setSettlement(null);
    setRules(emptyRules);
    setTutorialOpen(false);
    setTab("home");
  };

  const logout = async () => {
    if (session?.refreshToken) {
      await apiRequest("/api/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      }).catch(() => undefined);
    }
    resetSession();
  };

  const finishTutorial = (status: "completed" | "skipped") => {
    if (session?.householdId) {
      localStorage.setItem(
        tutorialStorageKey(session.user.userId, session.householdId),
        JSON.stringify({ status, completedAt: new Date().toISOString() }),
      );
    }
    setTutorialOpen(false);
    setTab("home");
  };

  const restartTutorial = () => {
    setTutorialRunId((value) => value + 1);
    setTutorialOpen(true);
  };

  const getCategoryName = (id: string) =>
    data.categories.find((category) => category.categoryId === id)?.name ??
    "Gasto";
  const getMemberName = (id: string) => memberName(data.members, id);

  return (
    <main className="app-shell">
      <section className="phone-frame">
        {!hydrated ? (
          <LoadingView />
        ) : !session ? (
          <SetupView
            onSubmit={authenticate}
            message={message}
            loading={loading}
          />
        ) : !hasHousehold ? (
          <OnboardingView
            userName={session.currentUserName}
            createHousehold={createHousehold}
            joinHousehold={joinHousehold}
            logout={logout}
            message={message}
            loading={loading}
          />
        ) : (
          <>
            <header className="topbar">
              <div>
                <p className="eyebrow">{monthLabel(selectedMonth)}</p>
                <h1>{session.householdName}</h1>
              </div>
              <button
                className="avatar-button"
                aria-label={`Abrir Casa, perfil de ${session.currentUserName}`}
                title="Casa"
                onClick={() => setTab("house")}
              >
                {session.currentUserName.slice(0, 1).toUpperCase()}
              </button>
            </header>

            <div className="main-region">
              {message && (
                <p className="toast-message" role="status">
                  {message}
                </p>
              )}

              <div className="content">
                {tab === "home" && (
                  <HomeView
                    currentBalance={currentBalance}
                    expenses={expenses}
                    absences={absences}
                    settlement={settlement}
                    week={week}
                    categoryName={getCategoryName}
                    memberName={getMemberName}
                    currentMembershipId={session.currentMembershipId}
                    onOpenExpense={() => setExpenseDialogOpen(true)}
                    onGoToExpenses={() => setTab("expenses")}
                    onGoToAbsences={() => setTab("absences")}
                    onGoToHouse={() => setTab("house")}
                    onGoToRules={() => setTab("rules")}
                    onPayExpense={openPayment}
                  />
                )}
                {tab === "expenses" && (
                  <ExpensesView
                    expenses={expenses}
                    categories={data.categories}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    onOpenExpense={() => setExpenseDialogOpen(true)}
                    categoryName={getCategoryName}
                    memberName={getMemberName}
                    currentMembershipId={session.currentMembershipId}
                    onPayExpense={openPayment}
                  />
                )}
                {tab === "rules" && (
                  <RulesView
                    categories={data.categories}
                    members={data.members}
                    rules={rules}
                    currentMembershipId={session.currentMembershipId!}
                    canManageHouse={canManageHouse}
                    loading={loading}
                    onCreateCategory={createCategory}
                    onSetPreference={setPreference}
                  />
                )}
                {tab === "absences" && (
                  <AbsencesView
                    members={data.members}
                    absences={absences}
                    settlement={settlement}
                    week={week}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    currentMembershipId={session.currentMembershipId!}
                    currentRole={session.role}
                    canManageHouse={canManageHouse}
                    loading={loading}
                    onCreateAbsence={createAbsence}
                    onCancelAbsence={cancelAbsence}
                    memberName={getMemberName}
                  />
                )}
                {tab === "house" && (
                  <HouseView
                    data={data}
                    week={week}
                    currentMembershipId={session.currentMembershipId!}
                    createArea={createArea}
                    createTask={createTask}
                    generateWeek={generateWeek}
                    markAssignment={markAssignment}
                    logout={logout}
                    restartTutorial={restartTutorial}
                    inviteCode={session.inviteCode}
                    role={session.role}
                    regenerateInviteCode={regenerateInviteCode}
                    loading={loading}
                    canManageHouse={canManageHouse}
                  />
                )}
              </div>
            </div>

            <nav className="bottom-nav" aria-label="Navegación principal">
              <NavButton
                icon={Home}
                label="Inicio"
                active={tab === "home"}
                onClick={() => setTab("home")}
              />
              <NavButton
                icon={ReceiptText}
                label="Gastos"
                active={tab === "expenses"}
                onClick={() => setTab("expenses")}
              />
              <NavButton
                icon={SlidersHorizontal}
                label="Reglas"
                active={tab === "rules"}
                onClick={() => setTab("rules")}
              />
              <NavButton
                icon={CalendarOff}
                label="Ausencias"
                active={tab === "absences"}
                onClick={() => setTab("absences")}
              />
              <NavButton
                icon={Users}
                label="Casa"
                active={tab === "house"}
                onClick={() => setTab("house")}
              />
            </nav>

            <ExpenseDialog
              open={expenseDialogOpen}
              categories={data.categories}
              payerName={session.currentUserName}
              onClose={() => setExpenseDialogOpen(false)}
              onNeedCategory={() => setTab("rules")}
              onSubmit={createExpense}
            />
            <PaymentDialog
              open={paymentDialogOpen}
              expense={paymentExpense}
              currentMembershipId={session.currentMembershipId}
              categoryName={getCategoryName}
              memberName={getMemberName}
              onClose={closePayment}
              onSubmit={createPayment}
            />
            <TutorialDialog
              key={tutorialRunId}
              open={tutorialOpen}
              steps={tutorialSteps}
              onSectionChange={setTab}
              onExit={finishTutorial}
            />
          </>
        )}
      </section>
    </main>
  );
}

function LoadingView() {
  return (
    <div
      className="loading-screen"
      role="status"
      aria-label="Cargando Casa Viva"
    >
      <span className="brand-mark">
        <Home size={27} />
      </span>
      <span className="loading-line" />
    </div>
  );
}

function SetupView({
  onSubmit,
  message,
  loading,
}: {
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    mode: "login" | "register",
  ) => void;
  message: string | null;
  loading: boolean;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <div className="setup-screen">
      <header className="auth-header">
        <span className="brand-mark">
          <Home size={27} />
        </span>
        <p className="eyebrow">Casa Viva</p>
        <h1>{mode === "login" ? "Volver a tu casa" : "Crear tu cuenta"}</h1>
        <p>Gastos claros para convivir mejor.</p>
      </header>
      <div className="segmented-control" aria-label="Acceso">
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => setMode("login")}
          type="button"
        >
          Entrar
        </button>
        <button
          className={mode === "register" ? "active" : ""}
          onClick={() => setMode("register")}
          type="button"
        >
          Crear cuenta
        </button>
      </div>
      <form className="form-card" onSubmit={(event) => onSubmit(event, mode)}>
        {mode === "register" && (
          <label>
            Nombre
            <input
              name="name"
              autoComplete="name"
              placeholder="Claudia"
              required
            />
          </label>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="claudia@mail.com"
            required
          />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            minLength={8}
            required
          />
        </label>
        <button className="primary-action full-action" disabled={loading}>
          {loading
            ? "Espera un momento..."
            : mode === "login"
              ? "Entrar"
              : "Crear cuenta"}
        </button>
      </form>
      {message && (
        <p className="toast-message inline-toast" role="status">
          {message}
        </p>
      )}
    </div>
  );
}

function OnboardingView({
  userName,
  createHousehold,
  joinHousehold,
  logout,
  message,
  loading,
}: {
  userName: string;
  createHousehold: (name: string) => Promise<boolean>;
  joinHousehold: (code: string, livingSince: string) => Promise<boolean>;
  logout: () => void;
  message: string | null;
  loading: boolean;
}) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const value = String(
      formData.get(mode === "create" ? "householdName" : "inviteCode") ?? "",
    ).trim();
    const livingSince = String(formData.get("livingSince") ?? dateInputValue()).trim();
    if (!value) return;
    const saved =
      mode === "create"
        ? await createHousehold(value)
        : await joinHousehold(value.toUpperCase(), livingSince);
    if (saved) form.reset();
  };
  return (
    <div className="setup-screen">
      <header className="auth-header compact-auth">
        <span className="brand-mark">
          <KeyRound size={26} />
        </span>
        <p className="eyebrow">Hola, {userName}</p>
        <h1>Elige una casa</h1>
      </header>
      <div className="segmented-control" aria-label="Elegir casa">
        <button
          className={mode === "create" ? "active" : ""}
          onClick={() => setMode("create")}
          type="button"
        >
          Crear
        </button>
        <button
          className={mode === "join" ? "active" : ""}
          onClick={() => setMode("join")}
          type="button"
        >
          Usar código
        </button>
      </div>
      <form className="form-card" onSubmit={submit}>
        {mode === "create" ? (
          <label>
            Nombre de la casa
            <input name="householdName" placeholder="Casa Ñuñoa" required />
          </label>
        ) : (
          <>
            <label>
              Código de invitación
              <input
                name="inviteCode"
                autoCapitalize="characters"
                placeholder="ABCD12"
                required
              />
            </label>
            <label>
              Conviven desde
              <input name="livingSince" type="date" defaultValue={dateInputValue()} required />
            </label>
          </>
        )}
        <button className="primary-action full-action" disabled={loading}>
          {mode === "create" ? "Crear casa" : "Entrar a la casa"}
        </button>
      </form>
      {message && (
        <p className="toast-message inline-toast" role="status">
          {message}
        </p>
      )}
      <button className="text-action logout-link" onClick={logout}>
        <LogOut size={17} /> Cerrar sesión
      </button>
    </div>
  );
}

function HouseView({
  data,
  week,
  currentMembershipId,
  createArea,
  createTask,
  generateWeek,
  markAssignment,
  logout,
  restartTutorial,
  inviteCode,
  role,
  regenerateInviteCode,
  loading,
  canManageHouse,
}: {
  data: StoredData;
  week: ChoreWeek | null;
  currentMembershipId: string;
  createArea: (event: FormEvent<HTMLFormElement>) => void;
  createTask: (event: FormEvent<HTMLFormElement>) => void;
  generateWeek: () => void;
  markAssignment: (assignmentId: string, status: "DONE" | "NOT_DONE") => void;
  logout: () => void;
  restartTutorial: () => void;
  inviteCode?: string;
  role?: "ADMIN" | "MEMBER";
  regenerateInviteCode: () => void;
  loading: boolean;
  canManageHouse: boolean;
}) {
  return (
    <section data-tutorial="house">
      <div className="page-heading">
        <p className="eyebrow">Convivencia</p>
        <h2>Casa e integrantes</h2>
      </div>

      <section className="content-section">
        <div className="section-header">
          <h3>Integrantes</h3>
          <span>{data.members.length}</span>
        </div>
        <div className="member-list">
          {data.members.map((member) => (
            <div className="member-row" key={member.membershipId}>
              <span>{displayMemberName(member).slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{displayMemberName(member)}</strong>
                <p>
                  {member.role === "ADMIN" ? "Administrador" : "Integrante"}
                </p>
                <small>Convive desde {formatShortDate(member.livingSince)}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      {role === "ADMIN" && (
        <section className="content-section">
          <div className="section-header">
            <h3>Invitación</h3>
          </div>
          <div className="invite-code-box">
            <span>{inviteCode ?? "Sin código activo"}</span>
            <button
              className="icon-action"
              onClick={regenerateInviteCode}
              disabled={loading}
              aria-label="Generar un nuevo código"
              title="Generar un nuevo código"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </section>
      )}

      <section className="content-section help-section">
        <HelpCircle size={22} aria-hidden="true" />
        <div>
          <h3>Guía de Casa Viva</h3>
          <p>Repasa las secciones principales.</p>
        </div>
        <button className="soft-action" type="button" onClick={restartTutorial}>
          Ver guía
        </button>
      </section>

      <details className="secondary-section">
        <summary>
          <span>
            <BadgeCheck size={20} /> Tareas domésticas
          </span>
          <ChevronDown size={19} />
        </summary>
        <ChoresSection
          data={data}
          week={week}
          currentMembershipId={currentMembershipId}
          createArea={createArea}
          createTask={createTask}
          generateWeek={generateWeek}
          markAssignment={markAssignment}
          loading={loading}
          canManageHouse={canManageHouse}
        />
      </details>

      <button className="danger-action" onClick={logout}>
        <LogOut size={18} /> Cerrar sesión
      </button>
    </section>
  );
}

function ChoresSection({
  data,
  week,
  currentMembershipId,
  createArea,
  createTask,
  generateWeek,
  markAssignment,
  loading,
  canManageHouse,
}: {
  data: StoredData;
  week: ChoreWeek | null;
  currentMembershipId: string;
  createArea: (event: FormEvent<HTMLFormElement>) => void;
  createTask: (event: FormEvent<HTMLFormElement>) => void;
  generateWeek: () => void;
  markAssignment: (assignmentId: string, status: "DONE" | "NOT_DONE") => void;
  loading: boolean;
  canManageHouse: boolean;
}) {
  return (
    <div className="chores-section">
      {!week ? (
        <div className="empty-state-row">
          <p className="empty-state">No hay una semana generada.</p>
          {canManageHouse && (
            <button
              className="soft-action"
              onClick={generateWeek}
              disabled={loading}
            >
              Generar semana
            </button>
          )}
        </div>
      ) : (
        <div className="chore-list">
          {week.tasks.map((task) => (
            <ChoreRow
              key={task.choreTaskId}
              task={task}
              members={data.members}
              currentMembershipId={currentMembershipId}
              markAssignment={markAssignment}
            />
          ))}
        </div>
      )}

      {canManageHouse && (
        <details className="settings-disclosure">
          <summary>
            Configurar tareas <ChevronDown size={17} />
          </summary>
          <form className="inline-form" onSubmit={createArea}>
            <input name="name" placeholder="Nuevo espacio común" required />
            <button aria-label="Crear espacio" title="Crear espacio">
              <Plus size={18} />
            </button>
          </form>
          <div className="chip-list">
            {data.areas.map((area) => (
              <span key={area.commonAreaId}>
                <Bath size={15} /> {area.name}
              </span>
            ))}
          </div>
          <form className="form-card compact-form" onSubmit={createTask}>
            <label>
              Espacio
              <select
                name="commonAreaId"
                required
                disabled={data.areas.length === 0}
              >
                {data.areas.length === 0 ? (
                  <option>Crea un espacio primero</option>
                ) : (
                  data.areas.map((area) => (
                    <option value={area.commonAreaId} key={area.commonAreaId}>
                      {area.name}
                    </option>
                  ))
                )}
              </select>
            </label>
            <label>
              Tarea
              <input name="name" placeholder="Limpiar cocina" required />
            </label>
            <div className="date-pair">
              <label>
                Prioridad
                <input
                  name="priority"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </label>
              <label>
                Personas
                <input
                  name="assigneeLimit"
                  type="number"
                  min="1"
                  defaultValue="1"
                  required
                />
              </label>
            </div>
            <button className="soft-action">Crear tarea</button>
          </form>
        </details>
      )}
    </div>
  );
}

function ChoreRow({
  task,
  members,
  currentMembershipId,
  markAssignment,
}: {
  task: ChoreWeekTask;
  members: Member[];
  currentMembershipId: string;
  markAssignment: (assignmentId: string, status: "DONE" | "NOT_DONE") => void;
}) {
  const currentAssignment = task.assignments.find(
    (assignment) => assignment.membershipId === currentMembershipId,
  );
  const Icon =
    task.priority === 1 ? Bath : task.priority === 2 ? CookingPot : Leaf;
  return (
    <article className="chore-row">
      <span className="row-icon">
        <Icon size={19} />
      </span>
      <div>
        <h3>{task.name}</h3>
        <p>
          {task.assignments
            .map((assignment) => memberName(members, assignment.membershipId))
            .join(", ")}
        </p>
      </div>
      {currentAssignment && currentAssignment.status !== "DONE" ? (
        <button
          className="icon-action"
          aria-label="Marcar tarea hecha"
          title="Marcar tarea hecha"
          onClick={() => markAssignment(currentAssignment.assignmentId, "DONE")}
        >
          <Check size={18} />
        </button>
      ) : (
        <span
          className={
            task.weeklyStatus === "DONE" ? "status done" : "status pending"
          }
        >
          {task.weeklyStatus === "DONE" ? "Lista" : "Pendiente"}
        </span>
      )}
    </article>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={active ? "nav-button active" : "nav-button"}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={21} />
      <span>{label}</span>
    </button>
  );
}

function currentMonday(): string {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
  monday.setUTCDate(monday.getUTCDate() - day + 1);
  return monday.toISOString().slice(0, 10);
}

function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
