import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Cloud, Mail, Lock, ArrowLeft } from "lucide-react";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (!isLogin && password !== confirmPassword) {
      toast({ title: "Error", description: "Password tidak cocok", variant: "destructive" });
      return;
    }

    if (!isLogin && password.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "Login Gagal", description: error, variant: "destructive" });
        } else {
          toast({ title: "Login Berhasil", description: "Selamat datang!" });
          navigate("/admin/settings");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({ title: "Registrasi Gagal", description: error, variant: "destructive" });
        } else {
          toast({
            title: "Registrasi Berhasil",
            description: "Cek email Anda untuk verifikasi akun",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Cloud className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Cloud Backup</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Masuk untuk mengakses backup cloud" : "Buat akun untuk mulai backup ke cloud"}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{isLogin ? "Masuk" : "Daftar"}</CardTitle>
            <CardDescription>
              {isLogin ? "Masukkan email dan password" : "Buat akun baru"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Ulangi password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setConfirmPassword("");
                }}
              >
                {isLogin ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
              </button>
            </div>
          </CardContent>
        </Card>

        <Button
          variant="ghost"
          className="w-full"
          onClick={() => navigate("/admin/settings")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Pengaturan
        </Button>
      </div>
    </div>
  );
}
