"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Save, Loader2, Building, Mail, Phone, MapPin, CreditCard, Landmark } from "lucide-react"
import type { Supplier } from "@/lib/db"

interface SupplierFormProps {
  supplier?: Supplier
  isEditing?: boolean
}

export function SupplierForm({ supplier, isEditing = false }: SupplierFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    email: supplier?.email || "",
    phone: supplier?.phone || "",
    address: supplier?.address || "",
    tax_id: supplier?.tax_id || "",
    iban: supplier?.iban || "",
    bic: supplier?.bic || "",
    rib: supplier?.rib || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = isEditing ? `/api/suppliers/${supplier?.id}` : "/api/suppliers"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/suppliers")
      } else {
        throw new Error("Failed to save supplier")
      }
    } catch (error) {
      console.error("Error saving supplier:", error)
      // Could add error toast here
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="contact@company.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+216 XX XXX XXX"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="Enter full address"
                  className="pl-10"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Tax Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="tax_id">Tax ID / VAT Number</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => handleChange("tax_id", e.target.value)}
                placeholder="Enter tax identification number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Banking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Banking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e) => handleChange("iban", e.target.value)}
                placeholder="TN59 XXXX XXXX XXXX XXXX XXXX"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bic">BIC/SWIFT</Label>
                <Input
                  id="bic"
                  value={formData.bic}
                  onChange={(e) => handleChange("bic", e.target.value)}
                  placeholder="XXXXXXXX"
                />
              </div>

              <div>
                <Label htmlFor="rib">RIB</Label>
                <Input
                  id="rib"
                  value={formData.rib}
                  onChange={(e) => handleChange("rib", e.target.value)}
                  placeholder="XX XXX XXXXXXXXXXXXXXX XX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !formData.name}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? "Update" : "Create"} Supplier
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
