"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Plus,
  Users,
  DollarSign,
  UserPlus,
  UserMinus,
  Copy,
  Trash2,
  Calculator,
  ArrowRight,
  HandCoins,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatAmount, getCurrencySymbol } from "@/lib/currency"
import { useTranslation, type Language } from "@/lib/translations"

interface Group {
  id: string
  name: string
  description: string
  members: string[]
  expenses: Expense[]
  currency: string
  createdAt: string
  isActive: boolean
}

interface Expense {
  id: string
  description: string
  amount: number
  paidBy: string
  splitBetween: string[]
  date: string
  category: string
}

interface MemberBalance {
  name: string
  totalPaid: number
  totalOwed: number
  balance: number
}

interface Settlement {
  from: string
  to: string
  amount: number
}

interface GroupDetailProps {
  group: Group
  onUpdateGroup: (group: Group) => void
  onGoBack: () => void
  language?: Language
}

export function GroupDetail({ group, onUpdateGroup, onGoBack, language = "en" }: GroupDetailProps) {
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isBalancesOpen, setIsBalancesOpen] = useState(false)
  const [isCancelDebtOpen, setIsCancelDebtOpen] = useState(false)
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [newMemberName, setNewMemberName] = useState("")
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    paidBy: "",
    splitBetween: [] as string[],
    category: "General",
  })
  const { toast } = useToast()

  const t = useTranslation(language)

  const calculateMemberBalances = (): MemberBalance[] => {
    const balances: { [key: string]: MemberBalance } = {}

    group.members.forEach((member) => {
      balances[member] = {
        name: member,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0,
      }
    })

    group.expenses.forEach((expense) => {
      if (balances[expense.paidBy]) {
        balances[expense.paidBy].totalPaid += expense.amount
      }

      const amountPerPerson = expense.amount / expense.splitBetween.length
      expense.splitBetween.forEach((member) => {
        if (balances[member]) {
          balances[member].totalOwed += amountPerPerson
        }
      })
    })

    Object.values(balances).forEach((balance) => {
      balance.balance = balance.totalPaid - balance.totalOwed
    })

    return Object.values(balances).sort((a, b) => b.balance - a.balance)
  }

  const calculateSettlements = (): Settlement[] => {
    const balances = calculateMemberBalances()
    const settlements: Settlement[] = []

    const creditors = balances.filter((b) => b.balance > 0.01).map((b) => ({ ...b }))
    const debtors = balances.filter((b) => b.balance < -0.01).map((b) => ({ ...b }))

    let i = 0,
      j = 0
    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i]
      const debtor = debtors[j]

      const settleAmount = Math.min(creditor.balance, Math.abs(debtor.balance))

      if (settleAmount > 0.01) {
        settlements.push({
          from: debtor.name,
          to: creditor.name,
          amount: settleAmount,
        })

        creditor.balance -= settleAmount
        debtor.balance += settleAmount
      }

      if (creditor.balance < 0.01) i++
      if (Math.abs(debtor.balance) < 0.01) j++
    }

    return settlements
  }

  const getMemberBalance = (memberName: string): number => {
    const balances = calculateMemberBalances()
    const memberBalance = balances.find((b) => b.name === memberName)
    return memberBalance ? memberBalance.balance : 0
  }

  const addMember = () => {
    if (!newMemberName.trim()) {
      toast({
        title: t("error"),
        description: t("memberNameRequired"),
        variant: "destructive",
      })
      return
    }

    if (group.members.includes(newMemberName.trim())) {
      toast({
        title: t("error"),
        description: t("memberExists"),
        variant: "destructive",
      })
      return
    }

    const updatedGroup = {
      ...group,
      members: [...group.members, newMemberName.trim()],
    }

    onUpdateGroup(updatedGroup)
    setNewMemberName("")
    setIsAddMemberOpen(false)

    toast({
      title: t("success"),
      description: `${newMemberName.trim()} ${t("memberAdded")}`,
    })
  }

  const removeMember = (memberName: string) => {
    const updatedGroup = {
      ...group,
      members: group.members.filter((member) => member !== memberName),
    }

    onUpdateGroup(updatedGroup)

    toast({
      title: t("memberRemoved"),
      description: `${memberName} ${t("memberRemoved")}`,
    })
  }

  const addExpense = () => {
    if (!newExpense.description.trim()) {
      toast({
        title: t("error"),
        description: t("expenseDescriptionRequired"),
        variant: "destructive",
      })
      return
    }

    if (!newExpense.amount || Number.parseFloat(newExpense.amount) <= 0) {
      toast({
        title: t("error"),
        description: t("validAmountRequired"),
        variant: "destructive",
      })
      return
    }

    if (!newExpense.paidBy) {
      toast({
        title: t("error"),
        description: t("selectWhoPaidError"),
        variant: "destructive",
      })
      return
    }

    if (newExpense.splitBetween.length === 0) {
      toast({
        title: t("error"),
        description: t("selectSplitMembersError"),
        variant: "destructive",
      })
      return
    }

    const expense: Expense = {
      id: Date.now().toString(),
      description: newExpense.description.trim(),
      amount: Number.parseFloat(newExpense.amount),
      paidBy: newExpense.paidBy,
      splitBetween: newExpense.splitBetween,
      date: new Date().toISOString(),
      category: newExpense.category,
    }

    const updatedGroup = {
      ...group,
      expenses: [expense, ...group.expenses],
    }

    onUpdateGroup(updatedGroup)
    setNewExpense({
      description: "",
      amount: "",
      paidBy: "",
      splitBetween: [],
      category: t("general"),
    })
    setIsAddExpenseOpen(false)

    toast({
      title: t("success"),
      description: `${t("expenseDescription")} "${expense.description}" ${t("expenseAdded")}`,
    })
  }

  const deleteExpense = (expenseId: string) => {
    const updatedGroup = {
      ...group,
      expenses: group.expenses.filter((expense) => expense.id !== expenseId),
    }

    onUpdateGroup(updatedGroup)

    toast({
      title: t("expenseDeleted"),
      description: t("expenseDeletedDescription"),
    })
  }

  const toggleSplitMember = (memberName: string) => {
    setNewExpense((prev) => ({
      ...prev,
      splitBetween: prev.splitBetween.includes(memberName)
        ? prev.splitBetween.filter((name) => name !== memberName)
        : [...prev.splitBetween, memberName],
    }))
  }

  const selectAllMembers = () => {
    setNewExpense((prev) => ({
      ...prev,
      splitBetween: group.members,
    }))
  }

  const clearAllMembers = () => {
    setNewExpense((prev) => ({
      ...prev,
      splitBetween: [],
    }))
  }

  const copyInviteLink = () => {
    const inviteText = `Join my expense group "${group.name}" on SplitWise! Group ID: ${group.id}`
    navigator.clipboard.writeText(inviteText)

    toast({
      title: t("inviteCopied"),
      description: t("inviteDescription"),
    })
  }

  const getTotalExpenses = () => {
    return group.expenses
      .filter((expense) => expense.category !== t("debtCancellation"))
      .reduce((total, expense) => total + expense.amount, 0)
  }

  const expenseCategories = [
    { key: "general", label: t("general") },
    { key: "foodDining", label: t("foodDining") },
    { key: "transportation", label: t("transportation") },
    { key: "accommodation", label: t("accommodation") },
    { key: "entertainment", label: t("entertainment") },
    { key: "shopping", label: t("shopping") },
    { key: "utilities", label: t("utilities") },
    { key: "other", label: t("other") },
  ]

  const cancelDebt = (settlement: Settlement) => {
    const cancelExpense: Expense = {
      id: Date.now().toString(),
      description: `${t("debtCancellation")}: ${settlement.from} → ${settlement.to}`,
      amount: settlement.amount,
      paidBy: settlement.from, // El deudor paga
      splitBetween: [settlement.to], // El acreedor recibe el pago
      date: new Date().toISOString(),
      category: t("debtCancellation"),
    }

    const updatedGroup = {
      ...group,
      expenses: [cancelExpense, ...group.expenses],
    }

    onUpdateGroup(updatedGroup)
    setIsCancelDebtOpen(false)
    setSelectedSettlement(null)

    toast({
      title: t("debtCancelled"),
      description: `${settlement.from} ${t("paidDebtTo")} ${settlement.to}`,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onGoBack} className="p-3 -ml-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{group.name}</h1>
              {group.description && <p className="text-sm text-muted-foreground truncate">{group.description}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-20">
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{group.members.length}</div>
              <div className="text-sm text-muted-foreground">{t("membersCount")}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">
                {formatAmount(getTotalExpenses(), group.currency)}
              </div>
              <div className="text-sm text-muted-foreground">{t("total")}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 bg-transparent h-12 active:scale-95 transition-transform">
                <UserPlus className="w-4 h-4 mr-2" />
                {t("addMember")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto m-4">
              <DialogHeader>
                <DialogTitle>{t("addMemberTitle")}</DialogTitle>
                <DialogDescription>
                  {t("addMemberDescription")} "{group.name}"
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="member-name">{t("memberName")}</Label>
                  <Input
                    id="member-name"
                    placeholder={t("memberNamePlaceholder")}
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addMember()
                      }
                    }}
                    className="h-12 text-base"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsAddMemberOpen(false)} className="flex-1 h-12">
                    {t("cancel")}
                  </Button>
                  <Button onClick={addMember} className="flex-1 h-12 font-semibold">
                    {t("addMember")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={copyInviteLink}
            className="h-12 active:scale-95 transition-transform bg-transparent"
          >
            <Copy className="w-4 h-4 mr-2" />
            {t("invite")}
          </Button>

          <Dialog open={isBalancesOpen} onOpenChange={setIsBalancesOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={group.expenses.length === 0}
                className="h-12 active:scale-95 transition-transform bg-transparent"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {t("balances")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto m-4">
              <DialogHeader>
                <DialogTitle>{t("groupBalances")}</DialogTitle>
                <DialogDescription>{t("balancesDescription")}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-3">{t("memberBalances")}</h3>
                  <div className="space-y-3">
                    {calculateMemberBalances().map((balance) => (
                      <div key={balance.name} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {balance.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{balance.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {t("paid")}: {formatAmount(balance.totalPaid, group.currency)} • {t("owes")}:{" "}
                              {formatAmount(balance.totalOwed, group.currency)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${
                              balance.balance > 0.01
                                ? "text-green-600"
                                : balance.balance < -0.01
                                  ? "text-red-600"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {balance.balance > 0.01 ? "+" : ""}
                            {formatAmount(Math.abs(balance.balance), group.currency)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-3">{t("suggestedSettlements")}</h3>
                  {calculateSettlements().length === 0 ? (
                    <div className="text-center p-6 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground">{t("allSettled")}</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {calculateSettlements().map((settlement, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-card border rounded-lg">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-medium text-foreground">{settlement.from}</span>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{settlement.to}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-semibold">
                              {formatAmount(settlement.amount, group.currency)}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedSettlement(settlement)
                                setIsCancelDebtOpen(true)
                              }}
                              className="h-8 px-2"
                            >
                              <HandCoins className="w-3 h-3 mr-1" />
                              {t("cancelDebt")}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={() => setIsBalancesOpen(false)} className="w-full h-12 font-semibold">
                  {t("close")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t("membersCount")} ({group.members.length})
          </h2>

          {group.members.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{t("noMembersYet")}</h3>
                <p className="text-sm text-muted-foreground mb-6">{t("noMembersDescription")}</p>
                <Button onClick={() => setIsAddMemberOpen(true)} size="sm" className="h-10">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t("addFirstMember")}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {group.members.map((member, index) => {
                const balance = getMemberBalance(member)
                return (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">{member.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{member}</div>
                            <div className="text-xs text-muted-foreground">
                              {t("balance")}:{" "}
                              <span
                                className={
                                  balance > 0.01
                                    ? "text-green-600 font-medium"
                                    : balance < -0.01
                                      ? "text-red-600 font-medium"
                                      : ""
                                }
                              >
                                {balance > 0.01 ? "+" : ""}
                                {formatAmount(Math.abs(balance), group.currency)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMember(member)}
                          className="text-destructive hover:text-destructive p-3"
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t("recentExpenses")}</h2>
            <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  disabled={group.members.length === 0}
                  className="h-10 active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t("addExpense")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto m-4">
                <DialogHeader>
                  <DialogTitle>{t("addExpenseTitle")}</DialogTitle>
                  <DialogDescription>
                    {t("addExpenseDescription")} "{group.name}"
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="expense-description">{t("expenseDescription")}</Label>
                    <Input
                      id="expense-description"
                      placeholder={t("expenseDescriptionPlaceholder")}
                      value={newExpense.description}
                      onChange={(e) => setNewExpense((prev) => ({ ...prev, description: e.target.value }))}
                      className="h-12 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expense-amount">
                      {t("amount")} ({getCurrencySymbol(group.currency)})
                    </Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense((prev) => ({ ...prev, amount: e.target.value }))}
                      className="h-12 text-base"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expense-category">{t("category")}</Label>
                    <select
                      id="expense-category"
                      className="w-full p-3 border border-input rounded-md bg-background h-12 text-base"
                      value={newExpense.category}
                      onChange={(e) => setNewExpense((prev) => ({ ...prev, category: e.target.value }))}
                    >
                      {expenseCategories.map((category) => (
                        <option key={category.key} value={category.label}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="paid-by">{t("paidBy")}</Label>
                    <select
                      id="paid-by"
                      className="w-full p-3 border border-input rounded-md bg-background h-12 text-base"
                      value={newExpense.paidBy}
                      onChange={(e) => setNewExpense((prev) => ({ ...prev, paidBy: e.target.value }))}
                    >
                      <option value="">{t("selectWhoPaid")}</option>
                      {group.members.map((member) => (
                        <option key={member} value={member}>
                          {member}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>{t("splitBetween")}</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllMembers}
                          className="text-xs bg-transparent h-8"
                        >
                          {t("all")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllMembers}
                          className="text-xs bg-transparent h-8"
                        >
                          {t("none")}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-32 overflow-y-auto">
                      {group.members.map((member) => (
                        <div key={member} className="flex items-center space-x-3 p-2">
                          <Checkbox
                            id={`split-${member}`}
                            checked={newExpense.splitBetween.includes(member)}
                            onCheckedChange={() => toggleSplitMember(member)}
                            className="w-5 h-5"
                          />
                          <Label htmlFor={`split-${member}`} className="text-base">
                            {member}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {newExpense.splitBetween.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-3 p-3 bg-muted rounded-md">
                        {t("splitWays")} {newExpense.splitBetween.length} {t("ways")} ={" "}
                        {newExpense.amount
                          ? formatAmount(
                              Number.parseFloat(newExpense.amount) / newExpense.splitBetween.length,
                              group.currency,
                            )
                          : formatAmount(0, group.currency)}{" "}
                        {t("perPerson")}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsAddExpenseOpen(false)} className="flex-1 h-12">
                      {t("cancel")}
                    </Button>
                    <Button onClick={addExpense} className="flex-1 h-12 font-semibold">
                      {t("addExpense")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {group.expenses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{t("noExpensesYet")}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {group.members.length === 0 ? t("noExpensesWithoutMembers") : t("noExpensesDescription")}
                </p>
                {group.members.length > 0 && (
                  <Button size="sm" onClick={() => setIsAddExpenseOpen(true)} className="h-10">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("addFirstExpense")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {group.expenses.slice(0, 10).map((expense) => (
                <Card key={expense.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="font-medium text-foreground truncate">{expense.description}</div>
                          <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground whitespace-nowrap">
                            {expense.category}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t("paidBy")} {expense.paidBy} • {new Date(expense.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {t("splitBetween")}: {expense.splitBetween.join(", ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            {formatAmount(expense.amount, group.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatAmount(expense.amount / expense.splitBetween.length, group.currency)} {t("each")}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteExpense(expense.id)}
                          className="text-destructive hover:text-destructive p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isCancelDebtOpen} onOpenChange={setIsCancelDebtOpen}>
        <DialogContent className="max-w-sm mx-auto m-4">
          <DialogHeader>
            <DialogTitle>{t("cancelDebt")}</DialogTitle>
            <DialogDescription>
              {selectedSettlement && (
                <>
                  {t("confirmDebtCancellation")} {selectedSettlement.from} {t("owes")} {selectedSettlement.to}{" "}
                  {formatAmount(selectedSettlement.amount, group.currency)}?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSettlement && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedSettlement.from}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedSettlement.to}</span>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {formatAmount(selectedSettlement.amount, group.currency)}
                  </Badge>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{t("debtCancellationDescription")}</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsCancelDebtOpen(false)} className="flex-1 h-12">
                {t("cancel")}
              </Button>
              <Button
                onClick={() => selectedSettlement && cancelDebt(selectedSettlement)}
                className="flex-1 h-12 font-semibold"
              >
                {t("confirmPayment")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
