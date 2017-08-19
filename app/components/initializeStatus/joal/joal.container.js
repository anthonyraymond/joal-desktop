import { connect } from 'react-redux';
import Joal from './joal.component';

function mapStateToProps(state) {
  return {
    progressMaxValue: state.joal.downloadStats.length,
    progressCurrentValue: state.joal.downloadStats.downloaded,
    error: state.joal.error,
    hasCompleted: state.joal.hasCompleted
  };
}

export default connect(mapStateToProps)(Joal);
