import { connect } from 'react-redux';
import Electronupdater from './electronUpdater.component';

function mapStateToProps(state) {
  return {
    progressMaxValue: state.electronUpdater.downloadStats.length,
    progressCurrentValue: state.electronUpdater.downloadStats.downloaded,
    error: state.electronUpdater.error,
    hasCompleted: state.electronUpdater.hasCompleted,
    isWorking: state.electronUpdater.isWorking
  };
}

export default connect(mapStateToProps)(Electronupdater);
