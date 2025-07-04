import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import { gridDensityFactorSelector } from '../density';
import { calculatePinnedRowsHeight } from '../rows/gridRowsUtils';
import { useGridLogger, useGridSelector, useGridApiMethod, useGridApiEventHandler } from '../../utils';
import { useGridRegisterPipeProcessor } from '../../core/pipeProcessing';
import { gridPageCountSelector, gridPaginationModelSelector } from './gridPaginationSelector';
import { getPageCount, defaultPageSize, throwIfPageSizeExceedsTheLimit, getDefaultGridPaginationModel, getValidPage } from './gridPaginationUtils';
export var getDerivedPaginationModel = function getDerivedPaginationModel(paginationState, signature, paginationModelProp) {
  var _paginationModelProp$;
  var paginationModel = paginationState.paginationModel;
  var rowCount = paginationState.rowCount;
  var pageSize = (_paginationModelProp$ = paginationModelProp == null ? void 0 : paginationModelProp.pageSize) != null ? _paginationModelProp$ : paginationModel.pageSize;
  var pageCount = getPageCount(rowCount, pageSize);
  if (paginationModelProp && ((paginationModelProp == null ? void 0 : paginationModelProp.page) !== paginationModel.page || (paginationModelProp == null ? void 0 : paginationModelProp.pageSize) !== paginationModel.pageSize)) {
    paginationModel = paginationModelProp;
  }
  var validPage = getValidPage(paginationModel.page, pageCount);
  if (validPage !== paginationModel.page) {
    paginationModel = _extends({}, paginationModel, {
      page: validPage
    });
  }
  throwIfPageSizeExceedsTheLimit(paginationModel.pageSize, signature);
  return paginationModel;
};

/**
 * @requires useGridFilter (state)
 * @requires useGridDimensions (event) - can be after
 */
export var useGridPaginationModel = function useGridPaginationModel(apiRef, props) {
  var _props$initialState2;
  var logger = useGridLogger(apiRef, 'useGridPaginationModel');
  var densityFactor = useGridSelector(apiRef, gridDensityFactorSelector);
  var rowHeight = Math.floor(props.rowHeight * densityFactor);
  apiRef.current.registerControlState({
    stateId: 'paginationModel',
    propModel: props.paginationModel,
    propOnChange: props.onPaginationModelChange,
    stateSelector: gridPaginationModelSelector,
    changeEvent: 'paginationModelChange'
  });

  /**
   * API METHODS
   */
  var setPage = React.useCallback(function (page) {
    var currentModel = gridPaginationModelSelector(apiRef);
    if (page === currentModel.page) {
      return;
    }
    logger.debug("Setting page to ".concat(page));
    apiRef.current.setPaginationModel({
      page: page,
      pageSize: currentModel.pageSize
    });
  }, [apiRef, logger]);
  var setPageSize = React.useCallback(function (pageSize) {
    var currentModel = gridPaginationModelSelector(apiRef);
    if (pageSize === currentModel.pageSize) {
      return;
    }
    logger.debug("Setting page size to ".concat(pageSize));
    apiRef.current.setPaginationModel({
      pageSize: pageSize,
      page: currentModel.page
    });
  }, [apiRef, logger]);
  var setPaginationModel = React.useCallback(function (paginationModel) {
    var currentModel = gridPaginationModelSelector(apiRef);
    if (paginationModel === currentModel) {
      return;
    }
    logger.debug("Setting 'paginationModel' to", paginationModel);
    apiRef.current.setState(function (state) {
      return _extends({}, state, {
        pagination: _extends({}, state.pagination, {
          paginationModel: getDerivedPaginationModel(state.pagination, props.signature, paginationModel)
        })
      });
    });
  }, [apiRef, logger, props.signature]);
  var paginationModelApi = {
    setPage: setPage,
    setPageSize: setPageSize,
    setPaginationModel: setPaginationModel
  };
  useGridApiMethod(apiRef, paginationModelApi, 'public');

  /**
   * PRE-PROCESSING
   */
  var stateExportPreProcessing = React.useCallback(function (prevState, context) {
    var _props$initialState;
    var paginationModel = gridPaginationModelSelector(apiRef);
    var shouldExportPaginationModel =
    // Always export if the `exportOnlyDirtyModels` property is not activated
    !context.exportOnlyDirtyModels ||
    // Always export if the `paginationModel` is controlled
    props.paginationModel != null ||
    // Always export if the `paginationModel` has been initialized
    ((_props$initialState = props.initialState) == null || (_props$initialState = _props$initialState.pagination) == null ? void 0 : _props$initialState.paginationModel) != null ||
    // Export if `page` or `pageSize` is not equal to the default value
    paginationModel.page !== 0 && paginationModel.pageSize !== defaultPageSize(props.autoPageSize);
    if (!shouldExportPaginationModel) {
      return prevState;
    }
    return _extends({}, prevState, {
      pagination: _extends({}, prevState.pagination, {
        paginationModel: paginationModel
      })
    });
  }, [apiRef, props.paginationModel, (_props$initialState2 = props.initialState) == null || (_props$initialState2 = _props$initialState2.pagination) == null ? void 0 : _props$initialState2.paginationModel, props.autoPageSize]);
  var stateRestorePreProcessing = React.useCallback(function (params, context) {
    var _context$stateToResto, _context$stateToResto2;
    var paginationModel = (_context$stateToResto = context.stateToRestore.pagination) != null && _context$stateToResto.paginationModel ? _extends({}, getDefaultGridPaginationModel(props.autoPageSize), (_context$stateToResto2 = context.stateToRestore.pagination) == null ? void 0 : _context$stateToResto2.paginationModel) : gridPaginationModelSelector(apiRef);
    apiRef.current.setState(function (state) {
      return _extends({}, state, {
        pagination: _extends({}, state.pagination, {
          paginationModel: getDerivedPaginationModel(state.pagination, props.signature, paginationModel)
        })
      });
    });
    return params;
  }, [apiRef, props.autoPageSize, props.signature]);
  useGridRegisterPipeProcessor(apiRef, 'exportState', stateExportPreProcessing);
  useGridRegisterPipeProcessor(apiRef, 'restoreState', stateRestorePreProcessing);

  /**
   * EVENTS
   */
  var handlePaginationModelChange = function handlePaginationModelChange() {
    var _apiRef$current$virtu;
    var paginationModel = gridPaginationModelSelector(apiRef);
    if ((_apiRef$current$virtu = apiRef.current.virtualScrollerRef) != null && _apiRef$current$virtu.current) {
      apiRef.current.scrollToIndexes({
        rowIndex: paginationModel.page * paginationModel.pageSize
      });
    }
  };
  var handleUpdateAutoPageSize = React.useCallback(function () {
    if (!props.autoPageSize) {
      return;
    }
    var dimensions = apiRef.current.getRootDimensions() || {
      viewportInnerSize: {
        height: 0
      }
    };
    var pinnedRowsHeight = calculatePinnedRowsHeight(apiRef);
    var maximumPageSizeWithoutScrollBar = Math.floor((dimensions.viewportInnerSize.height - pinnedRowsHeight.top - pinnedRowsHeight.bottom) / rowHeight);
    apiRef.current.setPageSize(maximumPageSizeWithoutScrollBar);
  }, [apiRef, props.autoPageSize, rowHeight]);
  var handleRowCountChange = React.useCallback(function (newRowCount) {
    if (newRowCount == null) {
      return;
    }
    var paginationModel = gridPaginationModelSelector(apiRef);
    var pageCount = gridPageCountSelector(apiRef);
    if (paginationModel.page > pageCount - 1) {
      apiRef.current.setPage(Math.max(0, pageCount - 1));
    }
  }, [apiRef]);
  useGridApiEventHandler(apiRef, 'viewportInnerSizeChange', handleUpdateAutoPageSize);
  useGridApiEventHandler(apiRef, 'paginationModelChange', handlePaginationModelChange);
  useGridApiEventHandler(apiRef, 'rowCountChange', handleRowCountChange);

  /**
   * EFFECTS
   */
  React.useEffect(function () {
    apiRef.current.setState(function (state) {
      return _extends({}, state, {
        pagination: _extends({}, state.pagination, {
          paginationModel: getDerivedPaginationModel(state.pagination, props.signature, props.paginationModel)
        })
      });
    });
  }, [apiRef, props.paginationModel, props.paginationMode, props.signature]);
  React.useEffect(handleUpdateAutoPageSize, [handleUpdateAutoPageSize]);
};