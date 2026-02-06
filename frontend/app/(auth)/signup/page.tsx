import { PageWrapper } from '@/components/ui/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SignupForm from '@/components/Auth/SignupForm';

export default function RegisterPage() {
  return (
    <PageWrapper className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black">
      <div className="max-w-md w-full">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-[#0FFF50] to-[#0CCC40]">
              Create Your Account
            </CardTitle>
            <CardDescription>
              Join us today to boost your productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}