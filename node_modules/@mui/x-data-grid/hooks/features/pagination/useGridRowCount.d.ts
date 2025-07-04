import * as React from 'react';
import { GridPrivateApiCommunity } from '../../../models/api/gridApiCommunity';
import { DataGridProcessedProps } from '../../../models/props/DataGridProps';
/**
 * @requires useGridFilter (state)
 * @requires useGridDimensions (event) - can be after
 */
export declare const useGridRowCount: (apiRef: React.MutableRefObject<GridPrivateApiCommunity>, props: Pick<DataGridProcessedProps, 'rowCount' | 'initialState' | 'paginationMode' | 'onRowCountChange'>) => void;
