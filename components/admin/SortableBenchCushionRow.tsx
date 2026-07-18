'use client';

import { TableRow, TableCell, IconButton, Typography, Chip, Stack } from '@mui/material';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { BenchCushionStyle } from '@/lib/types/benchCushion';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableBenchCushionRowProps {
  style: BenchCushionStyle;
  onEdit: (style: BenchCushionStyle) => void;
  onDelete: (style: BenchCushionStyle) => void;
}

export default function SortableBenchCushionRow({
  style,
  onEdit,
  onDelete,
}: SortableBenchCushionRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: style.id });

  const rowStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={rowStyle}
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
      <TableCell>{style.name}</TableCell>
      <TableCell>{style.description || '-'}</TableCell>
      <TableCell>
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {style.variables.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              None
            </Typography>
          ) : (
            style.variables.map((v) => (
              <Chip key={v.name} label={v.name} size="small" />
            ))
          )}
        </Stack>
      </TableCell>
      <TableCell>
        {style.basePrice.toLocaleString(undefined, {
          style: 'currency',
          currency: style.currency.toUpperCase(),
        })}
      </TableCell>
      <TableCell>
        {style.images[0] ? (
          <img
            src={style.images[0]}
            alt={style.name}
            style={{ width: 50, height: 50, objectFit: 'cover' }}
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            No image
          </Typography>
        )}
      </TableCell>
      <TableCell align="right">
        <IconButton size="small" onClick={() => onEdit(style)}>
          <EditIcon />
        </IconButton>
        <IconButton size="small" onClick={() => onDelete(style)}>
          <DeleteIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}
