import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import { gridFilteredTopLevelRowCountSelector } from '../filter';
import { useGridLogger, useGridSelector, useGridApiMethod } from '../../utils';
import { useGridRegisterPipeProcessor } from '../../core/pipeProcessing';
import { gridPaginationRowCountSelector } from './gridPaginationSelector';
import { noRowCountInServerMode } from './gridPaginationUtils';

/**
 * @requires useGridFilter (state)
 * @requires useGridDimensions (event) - can be after
 */
export var useGridRowCount = function useGridRowCount(apiRef, props) {
  var _props$initialState2;
  var logger = useGridLogger(apiRef, 'useGridRowCount');
  var visibleTopLevelRowCount = useGridSelector(apiRef, gridFilteredTopLevelRowCountSelector);
  var rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector);
  apiRef.current.registerControlState({
    stateId: 'paginationRowCount',
    propModel: props.rowCount,
    propOnChange: props.onRowCountChange,
    stateSelector: gridPaginationRowCountSelector,
    changeEvent: 'rowCountChange'
  });

  /**
   * API METHODS
   */
  var setRowCount = React.useCallback(function (newRowCount) {
    if (rowCount === newRowCount) {
      return;
    }
    logger.debug("Setting 'rowCount' to", newRowCount);
    apiRef.current.setState(function (state) {
      return _extends({}, state, {
        pagination: _extends({}, state.pagination, {
          rowCount: newRowCount
        })
      });
    });
  }, [apiRef, logger, rowCount]);
  var paginationRowCountApi = {
    setRowCount: setRowCount
  };
  useGridApiMethod(apiRef, paginationRowCountApi, 'public');

  /**
   * PRE-PROCESSING
   */
  var stateExportPreProcessing = React.useCallback(function (prevState, context) {
    var _props$initialState;
    var exportedRowCount = gridPaginationRowCountSelector(apiRef);
    var shouldExportRowCount =
    // Always export if the `exportOnlyDirtyModels` property is not activated
    !context.exportOnlyDirtyModels ||
    // Always export if the `rowCount` is controlled
    props.rowCount != null ||
    // Always export if the `rowCount` has been initialized
    ((_props$initialState = props.initialState) == null || (_props$initialState = _props$initialState.pagination) == null ? void 0 : _props$initialState.rowCount) != null;
    if (!shouldExportRowCount) {
      return prevState;
    }
    return _extends({}, prevState, {
      pagination: _extends({}, prevState.pagination, {
        rowCount: exportedRowCount
      })
    });
  }, [apiRef, props.rowCount, (_props$initialState2 = props.initialState) == null || (_props$initialState2 = _props$initialState2.pagination) == null ? void 0 : _props$initialState2.rowCount]);
  var stateRestorePreProcessing = React.useCallback(function (params, context) {
    var _context$stateToResto;
    var restoredRowCount = (_context$stateToResto = context.stateToRestore.pagination) != null && _context$stateToResto.rowCount ? context.stateToRestore.pagination.rowCount : gridPaginationRowCountSelector(apiRef);
    apiRef.current.setState(function (state) {
      return _extends({}, state, {
        pagination: _extends({}, state.pagination, {
          rowCount: restoredRowCount
        })
      });
    });
    return params;
  }, [apiRef]);
  useGridRegisterPipeProcessor(apiRef, 'exportState', stateExportPreProcessing);
  useGridRegisterPipeProcessor(apiRef, 'restoreState', stateRestorePreProcessing);

  /**
   * EFFECTS
   */
  React.useEffect(function () {
    if (process.env.NODE_ENV !== 'production') {
      if (props.paginationMode === 'server' && props.rowCount == null) {
        noRowCountInServerMode();
      }
    }
  }, [props.rowCount, props.paginationMode]);
  React.useEffect(function () {
    if (props.paginationMode === 'client') {
      apiRef.current.setRowCount(visibleTopLevelRowCount);
    } else if (props.rowCount != null) {
      apiRef.current.setRowCount(props.rowCount);
    }
  }, [apiRef, visibleTopLevelRowCount, props.paginationMode, props.rowCount]);
};