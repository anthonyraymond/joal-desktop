import type { Action } from './types';

const createReducer = (initialState: ?{}, handlers: {}) => (
  state: ?{} = initialState,
  action: Action
) =>
  Object.prototype.toString.call(handlers[action.type]) === '[object Function]'
    ? handlers[action.type](state, action)
    : state;

export default createReducer;
