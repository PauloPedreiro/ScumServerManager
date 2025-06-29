import _extends from "@babel/runtime/helpers/esm/extends";
import { throwIfPageSizeExceedsTheLimit, getDefaultGridPaginationModel } from './gridPaginationUtils';
import { useGridPaginationModel } from './useGridPaginationModel';
import { useGridRowCount } from './useGridRowCount';
export var paginationStateInitializer = function paginationStateInitializer(state, props) {
  var _props$paginationMode, _props$initialState, _ref, _props$rowCount, _props$initialState2;
  var paginationModel = _extends({}, getDefaultGridPaginationModel(props.autoPageSize), (_props$paginationMode = props.paginationModel) != null ? _props$paginationMode : (_props$initialState = props.initialState) == null || (_props$initialState = _props$initialState.pagination) == null ? void 0 : _props$initialState.paginationModel);
  throwIfPageSizeExceedsTheLimit(paginationModel.pageSize, props.signature);
  var rowCount = (_ref = (_props$rowCount = props.rowCount) != null ? _props$rowCount : (_props$initialState2 = props.initialState) == null || (_props$initialState2 = _props$initialState2.pagination) == null ? void 0 : _props$initialState2.rowCount) != null ? _ref : 0;
  return _extends({}, state, {
    pagination: {
      paginationModel: paginationModel,
      rowCount: rowCount
    }
  });
};

/**
 * @requires useGridFilter (state)
 * @requires useGridDimensions (event) - can be after
 */
export var useGridPagination = function useGridPagination(apiRef, props) {
  useGridPaginationModel(apiRef, props);
  useGridRowCount(apiRef, props);
};