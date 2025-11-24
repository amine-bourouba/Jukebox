interface SnackbarProps {
  message: string;
  color: string;
}

type ShowSnackbarFunction = (props: SnackbarProps) => void;

class SnackbarService {
  private showSnackbarFn: ShowSnackbarFunction | null = null;

  register(fn: ShowSnackbarFunction) {
    this.showSnackbarFn = fn;
  }

  show(props: SnackbarProps) {
    if (this.showSnackbarFn) {
      this.showSnackbarFn(props);
    } else {
      console.warn('Snackbar service not initialized');
    }
  }
}

export const snackbar = new SnackbarService();