import {act, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {allowNextNavigation} from '../hooks/useUnsavedChangesPrompt.ts';
import {renderForm} from '../test/renderForm.tsx';
import {FormField} from '../types.ts';

type TestRecord = {
  first_name: string;
  last_name: string;
  deliverer_id: string;
  backup_deliverer_id: string;
  is_active: boolean;
  notes: string;
  birth_date: string;
};

const NAME_FIELDS: FormField<TestRecord>[] = [
  {id: 'first_name', label: 'First Name', required: true, width: 6},
  {id: 'last_name', label: 'Last Name', width: 6},
];

const save = () => screen.getByRole('button', {name: /^sav/i});

describe('OasisForm', () => {
  describe('rendering fields', () => {
    it('renders one control per field, of the type the field asks for', async () => {
      const load = vi.fn().mockResolvedValue([{value: 'a', label: 'Ana'}]);
      renderForm<TestRecord>({
        fields: [
          ...NAME_FIELDS,
          {id: 'is_active', label: 'Active', type: 'switch'},
          {id: 'notes', label: 'Notes', multiline: true},
          {id: 'birth_date', label: 'Birth Date', type: 'date'},
          {
            id: 'deliverer_id',
            label: 'Deliverer',
            type: 'select',
            options: {key: 'deliverer_options', load},
          },
        ],
      });

      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByRole('switch', {name: 'Active'})).toBeInTheDocument();
      // multiline swaps the <input> for a <textarea>; `type` reaches the input directly.
      expect(screen.getByLabelText('Notes').tagName).toBe('TEXTAREA');
      expect(screen.getByLabelText('Birth Date')).toHaveAttribute(
        'type',
        'date',
      );
      // The select renders a skeleton until its options resolve.
      expect(
        await screen.findByRole('combobox', {name: 'Deliverer'}),
      ).toBeInTheDocument();
    });

    it('populates the fields from origData', () => {
      renderForm<TestRecord>({
        fields: NAME_FIELDS,
        origData: {first_name: 'Amara', last_name: 'Okafor'},
      });

      expect(screen.getByLabelText('First Name')).toHaveValue('Amara');
      expect(screen.getByLabelText('Last Name')).toHaveValue('Okafor');
    });
  });

  describe('the Save button', () => {
    it('is disabled until something changes', async () => {
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS});

      expect(save()).toBeDisabled();
      await user.type(screen.getByLabelText('First Name'), 'A');
      expect(save()).toBeEnabled();
    });

    it('goes back to disabled when the edit is undone', async () => {
      const {user} = renderForm<TestRecord>({
        fields: NAME_FIELDS,
        origData: {first_name: 'Amara'},
      });

      const input = screen.getByLabelText('First Name');
      await user.type(input, '!');
      expect(save()).toBeEnabled();

      await user.type(input, '{backspace}');
      // react-hook-form compares against the default values, so this is clean again.
      await waitFor(() => expect(save()).toBeDisabled());
    });

    it('stays disabled while a save is in flight', async () => {
      // ISSUES: pages submit through a react-query mutation, which resolves immediately —
      // `submitting` is what actually holds the button, not RHF's own isSubmitting.
      const {user} = renderForm<TestRecord>({
        fields: NAME_FIELDS,
        origData: {first_name: 'Amara'},
        submitting: true,
      });

      await user.type(screen.getByLabelText('First Name'), '!');
      expect(save()).toBeDisabled();
    });

    it('keeps an accessible name while saving (ISSUES #45)', async () => {
      // The spinner used to replace the label outright, so for the length of the save a
      // screen reader announced only "button".
      const {user} = renderForm<TestRecord>({
        fields: NAME_FIELDS,
        origData: {first_name: 'Amara'},
        submitting: true,
      });

      await user.type(screen.getByLabelText('First Name'), '!');
      expect(save()).toHaveAccessibleName('Saving…');
    });

    it('is not rendered at all when the form is disabled', () => {
      renderForm<TestRecord>({fields: NAME_FIELDS, disabled: true});

      expect(screen.queryByRole('button', {name: /save/i})).toBeNull();
      expect(screen.getByLabelText('First Name')).toBeDisabled();
    });
  });

  describe('validation', () => {
    it('does not submit while a required field is empty', async () => {
      const onSubmit = vi.fn();
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS, onSubmit});

      // Dirty the optional field so Save is reachable with first_name still blank.
      await user.type(screen.getByLabelText('Last Name'), 'Okafor');
      await user.click(save());

      await waitFor(() =>
        expect(screen.getByLabelText('First Name')).toBeInvalid(),
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('submits the form values once the required field is filled', async () => {
      const onSubmit = vi.fn();
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS, onSubmit});

      await user.type(screen.getByLabelText('First Name'), 'Amara');
      await user.type(screen.getByLabelText('Last Name'), 'Okafor');
      await user.click(save());

      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({first_name: 'Amara', last_name: 'Okafor'}),
      );
    });
  });

  describe('select options', () => {
    it('shares one fetch between two fields with the same source key', async () => {
      const load = vi.fn().mockResolvedValue([{value: 'a', label: 'Ana'}]);
      const source = {key: 'deliverer_options', load};

      renderForm<TestRecord>({
        fields: [
          {
            id: 'deliverer_id',
            label: 'Deliverer',
            type: 'select',
            options: source,
          },
          {
            id: 'backup_deliverer_id',
            label: 'Backup Deliverer',
            type: 'select',
            options: source,
          },
        ],
      });

      await screen.findByRole('combobox', {name: 'Deliverer'});
      await screen.findByRole('combobox', {name: 'Backup Deliverer'});
      // The key is the query-cache key — that is the whole reason OptionSource is an
      // object rather than a bare function (CLAUDE.md §4).
      expect(load).toHaveBeenCalledTimes(1);
    });

    it('offers a None choice only when the field is not required', async () => {
      const options = [{value: 'a', label: 'Ana'}];
      const {user} = renderForm<TestRecord>({
        fields: [
          {id: 'deliverer_id', label: 'Deliverer', type: 'select', options},
          {
            id: 'backup_deliverer_id',
            label: 'Required Deliverer',
            type: 'select',
            options,
            required: true,
          },
        ],
      });

      await user.click(screen.getByRole('combobox', {name: 'Deliverer'}));
      expect(await screen.findByText('None')).toBeInTheDocument();
      await user.keyboard('{Escape}');

      await user.click(
        screen.getByRole('combobox', {name: 'Required Deliverer'}),
      );
      await waitFor(() =>
        expect(screen.getAllByRole('option')).toHaveLength(1),
      );
    });

    /**
     * MUI logs "You have provided an out-of-range value" on every render when a Select's
     * value matches no option. A record loaded from Postgres has `null` for an unset
     * column and a blank record omits the key, so both hit it — that used to be papered
     * over per-field (`deliverer_id || ''` in useParent) rather than fixed in OasisSelect.
     */
    it.each([
      ['undefined', undefined],
      ['null', null],
    ])(
      'renders an unset value (%s) without MUI warning',
      async (_label, value) => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderForm<TestRecord>({
          fields: [
            {
              id: 'deliverer_id',
              label: 'Deliverer',
              type: 'select',
              options: [{value: 'a', label: 'Ana'}],
            },
          ],
          origData: {deliverer_id: value} as Partial<TestRecord>,
        });

        const select = await screen.findByRole('combobox', {name: 'Deliverer'});
        // MUI renders a zero-width-space placeholder, so "empty" means no option label.
        expect(select).not.toHaveTextContent('Ana');
        for (const spy of [warn, error]) {
          expect(
            spy.mock.calls
              .map(String)
              .filter((c) => c.includes('out-of-range')),
          ).toEqual([]);
        }
        warn.mockRestore();
        error.mockRestore();
      },
    );
  });

  describe('the unsaved-changes prompt (ISSUES #26)', () => {
    const dialog = () => screen.findByText('Discard your changes?');
    /**
     * MUI keeps the Dialog mounted through its close transition, and it `aria-hidden`s the
     * rest of the app while it is there — so the form and the link stay unreachable until
     * it is fully gone, and waiting on the title text alone is not enough.
     */
    const closed = () =>
      waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    it('lets a clean form navigate away untouched', async () => {
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS});

      await user.click(screen.getByRole('link', {name: 'Go elsewhere'}));

      expect(
        await screen.findByRole('heading', {name: 'Elsewhere'}),
      ).toBeInTheDocument();
    });

    it('blocks navigation and asks first when the form is dirty', async () => {
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS});

      await user.type(screen.getByLabelText('First Name'), 'Amara');
      await user.click(screen.getByRole('link', {name: 'Go elsewhere'}));

      expect(await dialog()).toBeInTheDocument();
      expect(screen.queryByRole('heading', {name: 'Elsewhere'})).toBeNull();
    });

    it('stays on the page when the user cancels, edits intact', async () => {
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS});

      await user.type(screen.getByLabelText('First Name'), 'Amara');
      await user.click(screen.getByRole('link', {name: 'Go elsewhere'}));
      await dialog();
      await user.click(screen.getByRole('button', {name: 'Cancel'}));
      await closed();

      expect(screen.getByLabelText('First Name')).toHaveValue('Amara');
      expect(screen.queryByRole('heading', {name: 'Elsewhere'})).toBeNull();
    });

    it('navigates when the user confirms the discard', async () => {
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS});

      await user.type(screen.getByLabelText('First Name'), 'Amara');
      await user.click(screen.getByRole('link', {name: 'Go elsewhere'}));
      await dialog();
      await user.click(screen.getByRole('button', {name: 'Discard'}));

      expect(
        await screen.findByRole('heading', {name: 'Elsewhere'}),
      ).toBeInTheDocument();
    });

    it('prompts again when a cancelled navigation is retried', async () => {
      // `prompting` in the hook keeps one dialog per blocked navigation as the blocker's
      // identity churns, but it must not latch — a second genuine attempt still gets asked.
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS});

      await user.type(screen.getByLabelText('First Name'), 'Amara');
      await user.click(screen.getByRole('link', {name: 'Go elsewhere'}));
      await dialog();
      await user.click(screen.getByRole('button', {name: 'Cancel'}));
      await closed();

      await user.click(screen.getByRole('link', {name: 'Go elsewhere'}));
      expect(await dialog()).toBeInTheDocument();
    });

    it('stays silent for a navigation allowed by allowNextNavigation()', async () => {
      // The save-then-navigate path: the form is still dirty, but the user already
      // confirmed and got a toast, so a second dialog would be noise.
      const {user, router} = renderForm<TestRecord>({fields: NAME_FIELDS});

      await user.type(screen.getByLabelText('First Name'), 'Amara');
      await act(async () => {
        allowNextNavigation();
        await router.navigate('/elsewhere');
      });

      expect(
        await screen.findByRole('heading', {name: 'Elsewhere'}),
      ).toBeInTheDocument();
      expect(screen.queryByText('Discard your changes?')).toBeNull();
    });

    it('does not leave the allowance armed when no navigation follows', async () => {
      // allowNextNavigation() clears itself on a macrotask, so an aborted save cannot
      // swallow the next real prompt.
      const {user} = renderForm<TestRecord>({fields: NAME_FIELDS});

      await user.type(screen.getByLabelText('First Name'), 'Amara');
      act(() => allowNextNavigation());
      await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

      await user.click(screen.getByRole('link', {name: 'Go elsewhere'}));
      expect(await dialog()).toBeInTheDocument();
    });
  });
});
