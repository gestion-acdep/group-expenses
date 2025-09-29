"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, User, Settings, Moon, Sun, Globe } from "lucide-react"

interface ProfilePanelProps {
  isOpen: boolean
  onClose: () => void
  currentUser: string
  onUpdateUser: (name: string) => void
  theme: "light" | "dark"
  onThemeChange: (theme: "light" | "dark") => void
  language: "en" | "es"
  onLanguageChange: (language: "en" | "es") => void
}

export function ProfilePanel({
  isOpen,
  onClose,
  currentUser,
  onUpdateUser,
  theme,
  onThemeChange,
  language,
  onLanguageChange,
}: ProfilePanelProps) {
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState(currentUser)

  const handleSaveName = () => {
    if (newName.trim()) {
      onUpdateUser(newName.trim())
      setEditingName(false)
    }
  }

  const translations = {
    en: {
      profile: "Profile",
      settings: "Settings",
      name: "Name",
      edit: "Edit",
      save: "Save",
      cancel: "Cancel",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      language: "Language",
      english: "English",
      spanish: "Spanish",
    },
    es: {
      profile: "Perfil",
      settings: "Configuración",
      name: "Nombre",
      edit: "Editar",
      save: "Guardar",
      cancel: "Cancelar",
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      language: "Idioma",
      english: "Inglés",
      spanish: "Español",
    },
  }

  const t = translations[language]

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed inset-0 flex justify-center z-50 pointer-events-none">
        <div className="max-w-md w-full relative pointer-events-auto">
          <div
            className={`absolute right-0 top-0 h-full w-80 bg-background/95 backdrop-blur-sm border-l border-border shadow-2xl transform transition-all duration-300 ease-out ${
              isOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">{t.profile}</h2>
                <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Profile Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="w-4 h-4" />
                      {t.profile}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-semibold text-primary">
                          {currentUser.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="user-name">{t.name}</Label>
                      {editingName ? (
                        <div className="flex gap-2 mt-2">
                          <Input
                            id="user-name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveName()
                              if (e.key === "Escape") {
                                setEditingName(false)
                                setNewName(currentUser)
                              }
                            }}
                          />
                          <Button size="sm" onClick={handleSaveName}>
                            {t.save}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingName(false)
                              setNewName(currentUser)
                            }}
                          >
                            {t.cancel}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-2 p-3 bg-muted rounded-md">
                          <span className="font-medium">{currentUser}</span>
                          <Button size="sm" variant="outline" onClick={() => setEditingName(true)}>
                            {t.edit}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Settings Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Settings className="w-4 h-4" />
                      {t.settings}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Theme Setting */}
                    <div>
                      <Label className="text-sm font-medium">{t.theme}</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant={theme === "light" ? "default" : "outline"}
                          size="sm"
                          onClick={() => onThemeChange("light")}
                          className="flex-1"
                        >
                          <Sun className="w-4 h-4 mr-2" />
                          {t.light}
                        </Button>
                        <Button
                          variant={theme === "dark" ? "default" : "outline"}
                          size="sm"
                          onClick={() => onThemeChange("dark")}
                          className="flex-1"
                        >
                          <Moon className="w-4 h-4 mr-2" />
                          {t.dark}
                        </Button>
                      </div>
                    </div>

                    {/* Language Setting */}
                    <div>
                      <Label className="text-sm font-medium">{t.language}</Label>
                      <div className="flex gap-2 mt-2">
                        <Button
                          variant={language === "en" ? "default" : "outline"}
                          size="sm"
                          onClick={() => onLanguageChange("en")}
                          className="flex-1"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          {t.english}
                        </Button>
                        <Button
                          variant={language === "es" ? "default" : "outline"}
                          size="sm"
                          onClick={() => onLanguageChange("es")}
                          className="flex-1"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          {t.spanish}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
