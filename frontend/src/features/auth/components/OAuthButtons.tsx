import React from 'react';
import { FcGoogle } from 'react-icons/fc';
import { VscGithub } from 'react-icons/vsc';
import Button from '@/shared/components/Button';
import styles from './OAuthButtons.module.css';

interface OAuthButtonsProps {
  onGoogleClick?: () => void;
  onGitHubClick?: () => void;
  isLoading?: boolean;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onGoogleClick,
  onGitHubClick,
  isLoading,
}) => {
  return (
    <div className={styles.container}>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        leftIcon={<FcGoogle />}
        onClick={onGoogleClick}
        disabled={isLoading}
        className={styles.button}
      >
        Continue with Google
      </Button>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        leftIcon={<VscGithub />}
        onClick={onGitHubClick}
        disabled={isLoading}
        className={styles.button}
      >
        Continue with GitHub
      </Button>
    </div>
  );
};