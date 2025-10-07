"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, DollarSign, Calendar, Trash2, ArrowRight, Search, RefreshCw, User as UserIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GroupDetail } from "@/components/group-detail"
import { ProfilePanel } from "@/components/profile-panel"
import { CURRENCIES, POPULAR_CURRENCIES, getCurrencySymbol, formatAmount } from "@/lib/currency"
import { useTranslation } from "@/lib/translations"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import type { User } from "@/lib/auth-context"
import { Auth } from "@/components/auth"

interface Group {
  id: string
  name: string
  description: string
  members: string[]
  currency: string
  createdAt: string
  isActive: boolean
}

interface Invitation {
  id: number
  groupId: number
  invitedBy: number
  invitedAt: string
  group: {
    id: number
    name: string
    description?: string
    currency: string
  }
  invitedByUser: {
    id: number
    name: string
    email: string
  }
}



function ExpenseApp({ onLogout }: { onLogout?: () => void }) {
  const [groups, setGroups] = useState<Group[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [currencySearch, setCurrencySearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState("You")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [language, setLanguage] = useState<"en" | "es">("en")
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    currency: "USD",
  })
  const { toast } = useToast()
  const t = useTranslation(language)
  const groupsLoaded = useRef(false)

  useEffect(() => {
    const savedUser = localStorage.getItem("expense-user")
    const savedTheme = localStorage.getItem("expense-theme") as "light" | "dark"
    const savedLanguage = localStorage.getItem("expense-language") as "en" | "es"

    if (savedUser) setCurrentUser(savedUser)
    if (savedTheme) setTheme(savedTheme)
    if (savedLanguage) setLanguage(savedLanguage)
  }, [])

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("expense-theme", theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem("expense-user", currentUser)
  }, [currentUser])

  useEffect(() => {
    localStorage.setItem("expense-language", language)
  }, [language])

  useEffect(() => {
    if (groupsLoaded.current) return

    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load groups
        const groupsResponse = await fetch('/api/groups', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        })
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json()
          setGroups(groupsData.groups)
        }

        // Load invitations
        const invitationsResponse = await fetch('/api/invitations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          },
        })
        if (invitationsResponse.ok) {
          const invitationsData = await invitationsResponse.json()
          setInvitations(invitationsData.invitations)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
        toast({
          title: t("error"),
          description: t("error"),
          variant: "destructive",
        })
      }
      setIsLoading(false)
    }

    loadData()
    groupsLoaded.current = true
  }, [t])



  const refreshData = async () => {
    setIsRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const savedGroups = localStorage.getItem("expense-groups")
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups))
    }
    setIsRefreshing(false)

    toast({
      title: t("refreshed"),
      description: t("dataUpdated"),
    })
  }

  const createGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({
        title: t("error"),
        description: t("groupNameRequired"),
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          members: [currentUser],
          currency: newGroup.currency,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGroups((prev) => [data.group, ...prev])
        setNewGroup({ name: "", description: "", currency: "USD" })
        setCurrencySearch("")
        setIsCreateGroupOpen(false)

        toast({
          title: t("success"),
          description: `${t("groupName")} "${data.group.name}" ${t("groupCreatedSuccess")}`,
        })
      } else {
        const error = await response.json()
        toast({
          title: t("error"),
          description: error.error || t("error"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to create group:', error)
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      })
    }
  }

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      })

      if (response.ok) {
        setGroups((prev) => prev.filter((group) => group.id !== groupId))
        toast({
          title: t("groupDeleted"),
          description: t("groupDeletedDescription"),
        })
      } else {
        const error = await response.json()
        toast({
          title: t("error"),
          description: error.error || t("error"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to delete group:', error)
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      })
    }
  }

  const getTotalExpenses = (_group: Group) => {
    // TODO: Load expenses from API to calculate total
    return 0
  }

  const getActiveGroups = () => groups.filter((group) => group.isActive)
  const getClosedGroups = () => groups.filter((group) => !group.isActive)

  const updateGroup = async (updatedGroup: Group) => {
    try {
      const response = await fetch(`/api/groups/${updatedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({
          name: updatedGroup.name,
          description: updatedGroup.description,
          members: updatedGroup.members,
          currency: updatedGroup.currency,
          isActive: updatedGroup.isActive,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGroups((prev) => prev.map((group) => (group.id === updatedGroup.id ? data.group : group)))
      } else {
        const error = await response.json()
        toast({
          title: t("error"),
          description: error.error || t("error"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to update group:', error)
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      })
    }
  }

  const selectGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
  }

  const goBack = () => {
    setSelectedGroupId(null)
  }

  const handleInvitation = async (invitationId: number, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        // Remove the invitation from the list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))

        // If accepted, reload groups to include the new group
        if (action === 'accept') {
          const groupsResponse = await fetch('/api/groups', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
            },
          })
          if (groupsResponse.ok) {
            const groupsData = await groupsResponse.json()
            setGroups(groupsData.groups)
          }
        }

        toast({
          title: t("success"),
          description: action === 'accept' ? t("invitationAccepted") : t("invitationRejected"),
        })
      } else {
        const error = await response.json()
        toast({
          title: t("error"),
          description: error.error || t("error"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Failed to handle invitation:', error)
      toast({
        title: t("error"),
        description: t("error"),
        variant: "destructive",
      })
    }
  }

  const filteredCurrencies = CURRENCIES.filter(
    (currency) =>
      currency.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
      currency.code.toLowerCase().includes(currencySearch.toLowerCase()),
  )

  const displayCurrencies = currencySearch
    ? filteredCurrencies
    : [
        ...CURRENCIES.filter((c) => POPULAR_CURRENCIES.includes(c.code)),
        ...CURRENCIES.filter((c) => !POPULAR_CURRENCIES.includes(c.code)),
      ]

  if (selectedGroupId) {
    const selectedGroup = groups.find((group) => group.id === selectedGroupId)
    if (selectedGroup) {
      return <GroupDetail group={selectedGroup} onUpdateGroup={updateGroup} onGoBack={goBack} language={language} />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("loadingGroups")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-foreground">{t("appTitle")}</h1>
              <p className="text-muted-foreground text-sm mt-1">{t("appSubtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={refreshData} disabled={isRefreshing}>
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsProfileOpen(true)}>
                <UserIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ProfilePanel
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUpdateUser={setCurrentUser}
        theme={theme}
        onThemeChange={setTheme}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={onLogout}
      />

      <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-20">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{getActiveGroups().length}</div>
              <div className="text-sm text-muted-foreground">{t("activeGroups")}</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">
                {groups.reduce((total, group) => total + getTotalExpenses(group), 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">{t("totalExpenses")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Create Group Button */}
        <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
          <DialogTrigger asChild>
            <Button className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95">
              <Plus className="w-6 h-6 mr-3" />
              {t("createNewGroup")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto m-4">
            <DialogHeader>
              <DialogTitle>{t("createGroup")}</DialogTitle>
              <DialogDescription>{t("createGroupDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-name">{t("groupName")}</Label>
                <Input
                  id="group-name"
                  placeholder={t("groupNamePlaceholder")}
                  value={newGroup.name}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-12 text-base"
                />
              </div>
              <div>
                <Label htmlFor="group-description">{t("description")}</Label>
                <Textarea
                  id="group-description"
                  placeholder={t("descriptionPlaceholder")}
                  value={newGroup.description}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="text-base"
                />
              </div>
              <div>
                <Label htmlFor="currency">{t("currency")}</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder={t("searchCurrencies")}
                      value={currencySearch}
                      onChange={(e) => setCurrencySearch(e.target.value)}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-input rounded-md">
                    {displayCurrencies.slice(0, 20).map((currency) => (
                      <div
                        key={currency.code}
                        className={`flex items-center justify-between p-4 hover:bg-muted cursor-pointer border-b border-border last:border-b-0 active:bg-muted/80 transition-colors ${
                          newGroup.currency === currency.code ? "bg-primary/10" : ""
                        }`}
                        onClick={() => {
                          setNewGroup((prev) => ({ ...prev, currency: currency.code }))
                          setCurrencySearch("")
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{currency.flag}</span>
                          <div>
                            <div className="font-medium text-foreground">
                              {currency.code} - {currency.name}
                            </div>
                            <div className="text-sm text-muted-foreground">Symbol: {currency.symbol}</div>
                          </div>
                        </div>
                        {POPULAR_CURRENCIES.includes(currency.code) && !currencySearch && (
                          <Badge variant="secondary" className="text-xs">
                            {t("popular")}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {filteredCurrencies.length === 0 && currencySearch && (
                      <div className="p-4 text-center text-muted-foreground">{t("noCurrenciesFound")}</div>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("selected")}: {getCurrencySymbol(newGroup.currency)} {newGroup.currency}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateGroupOpen(false)
                    setCurrencySearch("")
                  }}
                  className="flex-1 h-12"
                >
                  {t("cancel")}
                </Button>
                <Button onClick={createGroup} className="flex-1 h-12 font-semibold">
                  {t("createGroup")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">{t("pendingInvitations")}</h2>
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{invitation.group.name}</CardTitle>
                        {invitation.group.description && (
                          <CardDescription className="text-sm mt-1 line-clamp-2">{invitation.group.description}</CardDescription>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          Invited by {invitation.invitedByUser.name} • {new Date(invitation.invitedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>Group</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>{invitation.group.currency}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInvitation(invitation.id, 'reject')}
                          className="text-destructive hover:text-destructive"
                        >
                          {t("reject")}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleInvitation(invitation.id, 'accept')}
                        >
                          {t("accept")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Groups */}
        {getActiveGroups().length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">{t("activeGroups")}</h2>
            <div className="space-y-4">
              {getActiveGroups().map((group) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-98 border-l-4 border-l-primary"
                  onClick={() => selectGroup(group.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{group.name}</CardTitle>
                        {group.description && (
                          <CardDescription className="text-sm mt-1 line-clamp-2">{group.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteGroup(group.id)
                          }}
                          className="text-destructive hover:text-destructive p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>
                            {group.members.length} {t("members")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-medium">{formatAmount(getTotalExpenses(group), group.currency)}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {t("active")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-3">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {t("created")} {new Date(group.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {groups.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">{t("noGroupsYet")}</h3>
            <p className="text-muted-foreground text-base mb-8 px-4">{t("noGroupsDescription")}</p>
          </div>
        )}

        {/* Closed Groups */}
        {getClosedGroups().length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">{t("closedGroups")}</h2>
            <div className="space-y-3">
              {getClosedGroups().map((group) => (
                <Card key={group.id} className="opacity-75 border-l-4 border-l-muted">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{group.name}</CardTitle>
                        {group.description && (
                          <CardDescription className="text-sm mt-1 line-clamp-2">{group.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs ml-3">
                        {t("closed")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {group.members.length} {t("members")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-medium">{formatAmount(getTotalExpenses(group), group.currency)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AppContent() {
  const { user, token, login, logout, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !token) {
    return <Auth onAuthSuccess={login} />
  }

  return <ExpenseAppWithAuth user={user} token={token} onLogout={logout} />
}

function ExpenseAppWithAuth({ user, token, onLogout }: { user: User, token: string, onLogout: () => void }) {
  return <ExpenseApp onLogout={onLogout} />
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
