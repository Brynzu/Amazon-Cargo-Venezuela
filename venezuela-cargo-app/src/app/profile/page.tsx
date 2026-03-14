"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [state, setState] = useState("")
  const [city, setCity] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

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
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center border">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="avatar">Profile Picture</Label>
                <Input id="avatar" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="mt-1" />
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
                <Input id="state" value={state} onChange={e => setState(e.target.value)} placeholder="Miranda" />
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
