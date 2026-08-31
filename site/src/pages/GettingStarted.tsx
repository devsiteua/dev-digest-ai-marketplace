import { CommandBlock } from '../components/CopyButton';
import { t } from '../i18n';

export function GettingStarted() {
  return (
    <>
      <h1>{t('gettingStarted.title')}</h1>

      <h2>1. {t('gettingStarted.step1')}</h2>
      <p>{t('gettingStarted.step1Body')}</p>
      <CommandBlock command="claude plugin marketplace add devsiteua/dev-digest-ai-marketplace" />

      <h2>2. {t('gettingStarted.step2')}</h2>
      <p>{t('gettingStarted.step2Body')}</p>
      <CommandBlock command="claude plugin install sdd-engineering@dev-digest-ai-marketplace --scope project" />

      <h2>3. {t('gettingStarted.step3')}</h2>
      <p>{t('gettingStarted.step3Body')}</p>
      <CommandBlock command="claude plugin list --json" />

      <h2>4. {t('gettingStarted.step4')}</h2>
      <p>{t('gettingStarted.step4Body')}</p>
      <pre>
        <code>{`// .claude/sdd-engineering.json — every key optional
{
  "specDir": "docs/specs/",
  "planDir": "docs/specs/plans/",
  "retroLedger": "docs/retro/ledger.md",
  "commands": { "typecheck": "pnpm typecheck", "archCheck": null }
}`}</code>
      </pre>
      <p className="note">{t('gettingStarted.configNote')}</p>
    </>
  );
}
