'use client';

import { TableRow, TableCell, IconButton, Typography } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Category } from '@/lib/types/category';

// Import drag-and-drop libraries
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableCategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export default function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

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
      <TableCell width={50}>
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
        <Typography variant="body1" fontWeight="medium">
          {category.name}
        </Typography>
      </TableCell>
      <TableCell>{category.description || '-'}</TableCell>
      <TableCell align="right">
        <IconButton size="small" onClick={() => onEdit(category)}>
          <EditIcon />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(category)}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
