'use client';

import { useEffect, useState } from 'react';
import { User, Lock, Globe, AlertTriangle, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { useT } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  full_name: z.string().min(2),
  phone: z.string().optional(),
  business_name: z.string().optional(),
});
type ProfileData = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  new_password: z.string().min(6),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, { path: ['confirm_password'], message: 'Mismatch' });
type PasswordData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { lang, setLang } = useLanguage();
  const t = useT(lang);
  const [email, setEmail] = useState('');

  const profileForm = useForm<ProfileData>({ resolver: zodResolver(profileSchema) });
  const pwForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        profileForm.reset({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          business_name: profile.business_name || '',
        });
      }
    };
    load();
  }, [profileForm]);

  const saveProfile = async (data: ProfileData) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').upsert({ id: user.id, email: user.email, ...data });
    toast.success(t.settings.updateSuccess);
  };

  const savePassword = async (data: PasswordData) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.new_password });
    if (error) { toast.error(error.message); return; }
    toast.success(lang === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed');
    pwForm.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t.settings.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === 'ar' ? 'إدارة حسابك وتفضيلاتك' : 'Manage your account and preferences'}
          </p>
        </div>
        {/* Action buttons go here */}
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile"><User className="me-2 size-3.5" />{t.settings.profile}</TabsTrigger>
          <TabsTrigger value="security"><Lock className="me-2 size-3.5" />{t.settings.security}</TabsTrigger>
          <TabsTrigger value="language"><Globe className="me-2 size-3.5" />{t.settings.language}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>{t.settings.profile}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t.settings.email}</Label>
                  <Input id="email" value={email} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">{t.settings.fullName}</Label>
                  <Input id="full_name" {...profileForm.register('full_name')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t.settings.phone}</Label>
                  <Input id="phone" {...profileForm.register('phone')} placeholder={t.auth.phonePlaceholder} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business">{t.settings.businessName}</Label>
                  <Input id="business" {...profileForm.register('business_name')} />
                </div>
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? <span className="spinner" /> : t.settings.saveChanges}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="max-w-xl">
            <CardHeader><CardTitle>{t.settings.changePassword}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={pwForm.handleSubmit(savePassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newpw">{t.settings.newPassword}</Label>
                  <Input id="newpw" type="password" {...pwForm.register('new_password')} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cpw">{t.auth.confirmPassword}</Label>
                  <Input id="cpw" type="password" {...pwForm.register('confirm_password')} placeholder="••••••••" />
                  {pwForm.formState.errors.confirm_password && (
                    <p className="text-xs text-destructive">{lang === 'ar' ? 'كلمتا المرور غير متطابقتان' : 'Passwords do not match'}</p>
                  )}
                </div>
                <Button type="submit" disabled={pwForm.formState.isSubmitting}>
                  {pwForm.formState.isSubmitting ? <span className="spinner" /> : t.settings.changePassword}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Alert className="max-w-xl border-destructive/30 bg-destructive/5">
            <AlertTriangle className="size-4 text-destructive" />
            <AlertTitle className="text-destructive">{t.settings.dangerZone}</AlertTitle>
            <AlertDescription>{t.settings.deleteAccountWarning}</AlertDescription>
            <Button variant="destructive" size="sm" className="mt-3">
              {t.settings.deleteAccount}
            </Button>
          </Alert>
        </TabsContent>

        <TabsContent value="language">
          <Card className="max-w-sm">
            <CardHeader><CardTitle>{t.settings.language}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {([
                { code: 'ar' as const, label: t.settings.arabic, flag: 'AR' },
                { code: 'en' as const, label: t.settings.english, flag: 'EN' },
              ]).map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setLang(opt.code)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 transition-colors',
                    lang === opt.code
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-accent'
                  )}
                >
                  <span className="font-mono text-xs font-bold">{opt.flag}</span>
                  <span className="font-medium">{opt.label}</span>
                  {lang === opt.code && <Check className="ms-auto size-4" />}
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
