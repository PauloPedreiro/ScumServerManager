import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import PropTypes from 'prop-types';
import TablePagination, { tablePaginationClasses } from '@mui/material/TablePagination';
import { styled } from '@mui/material/styles';
import { useGridSelector } from '../hooks/utils/useGridSelector';
import { useGridApiContext } from '../hooks/utils/useGridApiContext';
import { useGridRootProps } from '../hooks/utils/useGridRootProps';
import { gridPaginationModelSelector, gridPaginationRowCountSelector } from '../hooks/features/pagination/gridPaginationSelector';
import { jsx as _jsx } from "react/jsx-runtime";
const GridPaginationRoot = styled(TablePagination)(({
  theme
}) => ({
  [`& .${tablePaginationClasses.selectLabel}`]: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block'
    }
  },
  [`& .${tablePaginationClasses.input}`]: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'inline-flex'
    }
  }
}));

// A mutable version of a readonly array.

const GridPagination = /*#__PURE__*/React.forwardRef(function GridPagination(props, ref) {
  const apiRef = useGridApiContext();
  const rootProps = useGridRootProps();
  const paginationModel = useGridSelector(apiRef, gridPaginationModelSelector);
  const rowCount = useGridSelector(apiRef, gridPaginationRowCountSelector);
  const lastPage = React.useMemo(() => Math.floor(rowCount / (paginationModel.pageSize || 1)), [rowCount, paginationModel.pageSize]);
  const handlePageSizeChange = React.useCallback(event => {
    const pageSize = Number(event.target.value);
    apiRef.current.setPageSize(pageSize);
  }, [apiRef]);
  const handlePageChange = React.useCallback((_, page) => {
    apiRef.current.setPage(page);
  }, [apiRef]);
  const isPageSizeIncludedInPageSizeOptions = pageSize => {
    for (let i = 0; i < rootProps.pageSizeOptions.length; i += 1) {
      const option = rootProps.pageSizeOptions[i];
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
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const warnedOnceMissingInPageSizeOptions = React.useRef(false);
    const pageSize = rootProps.paginationModel?.pageSize ?? paginationModel.pageSize;
    if (!warnedOnceMissingInPageSizeOptions.current && !rootProps.autoPageSize && !isPageSizeIncludedInPageSizeOptions(pageSize)) {
      console.warn([`MUI X: The page size \`${paginationModel.pageSize}\` is not preset in the \`pageSizeOptions\`.`, `Add it to show the pagination select.`].join('\n'));
      warnedOnceMissingInPageSizeOptions.current = true;
    }
  }
  const pageSizeOptions = isPageSizeIncludedInPageSizeOptions(paginationModel.pageSize) ? rootProps.pageSizeOptions : [];
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