"use client"

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Pencil } from 'lucide-react'
import { getUniqueStates } from '@/lib/logistics'

export default function ProfilePage() {
  const states = getUniqueStates()
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
        if (data) {
          setFullName(data.full_name || "")
          setPhone(data.phone || "")
          setState(data.state || "")
          setCity(data.city || "")
          setZipCode(data.zip_code || "")
          setAvatarUrl(data.avatar_url || "")
        }
      }
    }
    loadProfile()
  }, [supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreviewUrl(URL.createObjectURL(selectedFile))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    setMessage("")

    try {
      let finalAvatarUrl = avatarUrl

      if (file) {
        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}-${Date.now()}.${fileExt}`
        // Ensure bucket is lowercase 'avatars'
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
        finalAvatarUrl = publicUrl
        setAvatarUrl(publicUrl)
      }

      const { error } = await supabase.from('users').update({
        full_name: fullName,
        phone: phone,
        state: state,
        city: city,
        zip_code: zipCode,
        avatar_url: finalAvatarUrl
      }).eq('id', user.id)

      if (error) throw error

      setMessage("Profile saved successfully!")
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <Card className="max-w-xl mx-auto shadow-sm border-gray-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative h-24 w-24 group">
                <div className="h-24 w-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border-2 border-gray-200">
                  {previewUrl || avatarUrl ? (
                    <img src={previewUrl || avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-gray-400" />
                  )}
                </div>

                {/* Hover overlay with pencil */}
                <div
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Pencil className="h-6 w-6 text-white" />
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp / Phone</Label>
                <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 890" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-700 pt-4 border-t">Default Destination Address</h3>
              <p className="text-sm text-gray-500 pb-2">Save time when creating new orders by pre-filling this data.</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Caracas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input id="zipCode" value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="1060" />
              </div>
            </div>

            {message && <p className={`text-sm font-medium ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>}

            <Button type="submit" disabled={isSaving} className="w-full h-11">
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
