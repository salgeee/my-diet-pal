import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { AuthForm } from '@/components/auth/AuthForm';
import { ProfileSetup } from '@/components/onboarding/ProfileSetup';
import Dashboard from './Dashboard';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - show auth form
  if (!user) {
    return <AuthForm />;
  }

  // Loading profile
  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Profile not complete - show onboarding
  if (!profile?.calorie_goal || profile.weight === 70 && profile.height === 170 && profile.age === 25) {
    return <ProfileSetup />;
  }

  // Fully authenticated and set up - show dashboard
  return <Dashboard />;
};

export default Index;
