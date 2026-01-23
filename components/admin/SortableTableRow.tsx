'use client';

import { TableRow, TableCell, IconButton, Chip, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FoamType } from '@/lib/types/foam';

// Import drag-and-drop libraries (they're in package.json)
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTableRowProps {
  foamType: FoamType;
  categoryName: string;
  onEdit: (foamType: FoamType) => void;
  onDelete: (foamType: FoamType) => void;
}

export default function SortableTableRow({
  foamType,
  categoryName,
  onEdit,
  onDelete,
}: SortableTableRowProps) {
  // Always call hooks unconditionally - React hooks rules
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: foamType.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      sx={{
        backgroundColor: isDragging ? 'action.hover' : 'inherit',
      }}
    >
      <TableCell>
        <IconButton
          size="small"
          {...attributes}
          {...listeners}
          sx={{
            cursor: 'grab',
            '&:active': {
              cursor: 'grabbing',
            },
          }}
        >
          <DragIndicatorIcon />
        </IconButton>
      </TableCell>
      <TableCell>
        <Chip label={categoryName} size="small" />
      </TableCell>
      <TableCell>{foamType.name}</TableCell>
      <TableCell>
        {foamType.description || '-'}
      </TableCell>
      <TableCell>
        {foamType.imageUrl ? (
          <img
            src={foamType.imageUrl}
            alt={foamType.name}
            style={{ width: 50, height: 50, objectFit: 'cover' }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            No image
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <IconButton size="small" onClick={() => onEdit(foamType)}>
          <EditIcon />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(foamType)}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
