import * as React from 'react';
import { TablePaginationProps } from '@mui/material/TablePagination';
interface GridPaginationOwnProps {
    component?: React.ElementType;
}
declare const GridPagination: React.ForwardRefExoticComponent<Omit<Partial<Omit<TablePaginationProps, "component">> & GridPaginationOwnProps, "ref"> & React.RefAttributes<unknown>>;
export { GridPagination };
