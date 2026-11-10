import { ConfirmService } from '../../services/confirm.service';

/**
 * Shared wording/styling for every "you'll lose unsaved input" prompt across
 * the app, so route-guard discards and in-page modal-close discards look and
 * read identically.
 */
export function confirmDiscard(confirmService: ConfirmService, what: string): Promise<boolean> {
  return confirmService.confirm({
    title: 'Discard unsaved changes?',
    message: `Your ${what} has not been saved. If you leave now, this will be lost.`,
    confirmText: 'Discard',
    cancelText: 'Keep editing',
    variant: 'danger'
  });
}
