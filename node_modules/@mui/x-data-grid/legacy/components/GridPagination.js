import _extends from "@babel/runtime/helpers/esm/extends";
import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import * as React from 'react';
import PropTypes from 'prop-types';
import TablePagination, { tablePaginationClasses } from '@mui/material/TablePagination';
import { styled } from '@mui/material/styles';
import { useGridSelector } from '../hooks/utils/useGridSelector';
import { useGridApiContext } from '../hooks/utils/useGridApiContext';
import { useGridRootProps } from '../hooks/utils/useGridRootProps';
import { gridPaginationModelSelector, gridPaginationRowCountSelector } from '../hooks/features/pagination/gridPaginationSelector';
import { jsx as _jsx } from "react/jsx-runtime";
var GridPaginationRoot = styled(TablePagination)(function (_ref) {
  var theme = _ref.theme;
  return _defineProperty(_defineProperty({}, "& .".concat(tablePaginationClasses.selectLabel), _defineProperty({
    display: 'none'
  }, theme.breakpoints.up('sm'), {
    display: 'block'
  })), "& .".concat(tablePaginationClasses.input), _defineProperty({
    display: 'none'
  }, theme.breakpoints.up('sm'), {
    display: 'inline-flex'
  }));
});

// A mutable version of a readonly array.

var GridPagination = /*#__PURE__*/React.forwardRef(function GridPagination(props, ref) {
  var apiRef = useGridApiContext();
  var rootProps = useGridRootProps();
  var paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  var rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector);
  var lastPage = React.useMemo(function () {
    return Math.floor(rowCount / (paginationModel.pageSize || 1));
  }, [rowCount, paginationModel.pageSize]);
  var handlePageSizeChange = React.useCallback(function (event) {
    var pageSize = Number(event.target.value);
    apiRef.current.setPageSize(pageSize);
  }, [apiRef]);
  var handlePageChange = React.useCallback(function (_, page) {
    apiRef.current.setPage(page);
  }, [apiRef]);
  var isPageSizeIncludedInPageSizeOptions = function isPageSizeIncludedInPageSizeOptions(pageSize) {
    for (var i = 0; i < rootProps.pageSizeOptions.length; i += 1) {
      var option = rootProps.pageSizeOptions[i];
      if (typeof option === 'number') {
        if (option === pageSize) {
          return true;
        }
      } else if (option.value === pageSize) {
        return true;
      }
    }
    return false;
  };
  if (process.env.NODE_ENV !== 'production') {
    var _rootProps$pagination, _rootProps$pagination2;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    var warnedOnceMissingInPageSizeOptions = React.useRef(false);
    var pageSize = (_rootProps$pagination = (_rootProps$pagination2 = rootProps.paginationModel) == null ? void 0 : _rootProps$pagination2.pageSize) != null ? _rootProps$pagination : paginationModel.pageSize;
    if (!warnedOnceMissingInPageSizeOptions.current && !rootProps.autoPageSize && !isPageSizeIncludedInPageSizeOptions(pageSize)) {
      console.warn(["MUI X: The page size `".concat(paginationModel.pageSize, "` is not preset in the `pageSizeOptions`."), "Add it to show the pagination select."].join('\n'));
      warnedOnceMissingInPageSizeOptions.current = true;
    }
  }
  var pageSizeOptions = isPageSizeIncludedInPageSizeOptions(paginationModel.pageSize) ? rootProps.pageSizeOptions : [];
  return /*#__PURE__*/_jsx(GridPaginationRoot, _extends({
    ref: ref,
    component: "div",
    count: rowCount,
    page: paginationModel.page <= lastPage ? paginationModel.page : lastPage
    // TODO: Remove the cast once the type is fixed in Material UI and that the min Material UI version
    // for x-data-grid is past the fix.
    // Note that Material UI will not mutate the array, so this is safe.
    ,
    rowsPerPageOptions: pageSizeOptions,
    rowsPerPage: paginationModel.pageSize,
    onPageChange: handlePageChange,
    onRowsPerPageChange: handlePageSizeChange
  }, apiRef.current.getLocaleText('MuiTablePagination'), props));
});
process.env.NODE_ENV !== "production" ? GridPagination.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  component: PropTypes.elementType
} : void 0;
export { GridPagination };