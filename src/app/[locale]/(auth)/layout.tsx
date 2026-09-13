import { AuthFlowLayout } from "@/components/auth/auth-flow-layout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthFlowLayout>{children}</AuthFlowLayout>;
}
