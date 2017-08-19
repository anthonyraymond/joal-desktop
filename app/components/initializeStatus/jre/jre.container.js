import { connect } from 'react-redux';
import Jre from './jre.component';

function mapStateToProps(state) {
  return {
    progressMaxValue: state.jre.downloadStats.length,
    progressCurrentValue: state.jre.downloadStats.downloaded,
    error: state.jre.error,
    hasCompleted: state.jre.hasCompleted
  };
}

export default connect(mapStateToProps)(Jre);
