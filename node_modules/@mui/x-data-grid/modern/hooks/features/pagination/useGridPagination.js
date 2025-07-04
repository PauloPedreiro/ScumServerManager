import _extends from "@babel/runtime/helpers/esm/extends";
import { throwIfPageSizeExceedsTheLimit, getDefaultGridPaginationModel } from './gridPaginationUtils';
import { useGridPaginationModel } from './useGridPaginationModel';
import { useGridRowCount } from './useGridRowCount';
export const paginationStateInitializer = (state, props) => {
  const paginationModel = _extends({}, getDefaultGridPaginationModel(props.autoPageSize), props.paginationModel ?? props.initialState?.pagination?.paginationModel);
  throwIfPageSizeExceedsTheLimit(paginationModel.pageSize, props.signature);
  const rowCount = props.rowCount ?? props.initialState?.pagination?.rowCount ?? 0;
  return _extends({}, state, {
    pagination: {
      paginationModel,
      rowCount
    }
  });
};

/**
 * @requires useGridFilter (state)
 * @requires useGridDimensions (event) - can be after
 */
export const useGridPagination = (apiRef, props) => {
  useGridPaginationModel(apiRef, props);
  useGridRowCount(apiRef, props);
};