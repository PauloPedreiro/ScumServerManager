"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useGridRowCount = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _filter = require("../filter");
var _utils = require("../../utils");
var _pipeProcessing = require("../../core/pipeProcessing");
var _gridPaginationSelector = require("./gridPaginationSelector");
var _gridPaginationUtils = require("./gridPaginationUtils");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * @requires useGridFilter (state)
 * @requires useGridDimensions (event) - can be after
 */
const useGridRowCount = (apiRef, props) => {
  const logger = (0, _utils.useGridLogger)(apiRef, 'useGridRowCount');
  const visibleTopLevelRowCount = (0, _utils.useGridSelector)(apiRef, _filter.gridFilteredTopLevelRowCountSelector);
  const rowCount = (0, _utils.useGridSelector)(apiRef, _gridPaginationSelector.gridPaginationRowCountSelector);
  apiRef.current.registerControlState({
    stateId: 'paginationRowCount',
    propModel: props.rowCount,
    propOnChange: props.onRowCountChange,
    stateSelector: _gridPaginationSelector.gridPaginationRowCountSelector,
    changeEvent: 'rowCountChange'
  });

  /**
   * API METHODS
   */
  const setRowCount = React.useCallback(newRowCount => {
    if (rowCount === newRowCount) {
      return;
    }
    logger.debug("Setting 'rowCount' to", newRowCount);
    apiRef.current.setState(state => (0, _extends2.default)({}, state, {
      pagination: (0, _extends2.default)({}, state.pagination, {
        rowCount: newRowCount
      })
    }));
  }, [apiRef, logger, rowCount]);
  const paginationRowCountApi = {
    setRowCount
  };
  (0, _utils.useGridApiMethod)(apiRef, paginationRowCountApi, 'public');

  /**
   * PRE-PROCESSING
   */
  const stateExportPreProcessing = React.useCallback((prevState, context) => {
    const exportedRowCount = (0, _gridPaginationSelector.gridPaginationRowCountSelector)(apiRef);
    const shouldExportRowCount =
    // Always export if the `exportOnlyDirtyModels` property is not activated
    !context.exportOnlyDirtyModels ||
    // Always export if the `rowCount` is controlled
    props.rowCount != null ||
    // Always export if the `rowCount` has been initialized
    props.initialState?.pagination?.rowCount != null;
    if (!shouldExportRowCount) {
      return prevState;
    }
    return (0, _extends2.default)({}, prevState, {
      pagination: (0, _extends2.default)({}, prevState.pagination, {
        rowCount: exportedRowCount
      })
    });
  }, [apiRef, props.rowCount, props.initialState?.pagination?.rowCount]);
  const stateRestorePreProcessing = React.useCallback((params, context) => {
    const restoredRowCount = context.stateToRestore.pagination?.rowCount ? context.stateToRestore.pagination.rowCount : (0, _gridPaginationSelector.gridPaginationRowCountSelector)(apiRef);
    apiRef.current.setState(state => (0, _extends2.default)({}, state, {
      pagination: (0, _extends2.default)({}, state.pagination, {
        rowCount: restoredRowCount
      })
    }));
    return params;
  }, [apiRef]);
  (0, _pipeProcessing.useGridRegisterPipeProcessor)(apiRef, 'exportState', stateExportPreProcessing);
  (0, _pipeProcessing.useGridRegisterPipeProcessor)(apiRef, 'restoreState', stateRestorePreProcessing);

  /**
   * EFFECTS
   */
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (props.paginationMode === 'server' && props.rowCount == null) {
        (0, _gridPaginationUtils.noRowCountInServerMode)();
      }
    }
  }, [props.rowCount, props.paginationMode]);
  React.useEffect(() => {
    if (props.paginationMode === 'client') {
      apiRef.current.setRowCount(visibleTopLevelRowCount);
    } else if (props.rowCount != null) {
      apiRef.current.setRowCount(props.rowCount);
    }
  }, [apiRef, visibleTopLevelRowCount, props.paginationMode, props.rowCount]);
};
exports.useGridRowCount = useGridRowCount;