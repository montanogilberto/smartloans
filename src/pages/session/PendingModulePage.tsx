import './PendingModule/PendingModule.css';
import PendingModuleView from './PendingModule/PendingModuleView';

/**
 * Router shell for a dashboard whose module hasn't been migrated from
 * POSVending yet (see POSVending docs/smartloans-repo-migration.md).
 */
const PendingModulePage: React.FC<{ title: string }> = ({ title }) => <PendingModuleView title={title} />;

export default PendingModulePage;
