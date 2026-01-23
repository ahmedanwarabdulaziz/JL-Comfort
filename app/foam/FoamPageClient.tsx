'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Paper,
  Divider,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import Link from 'next/link';
import { Category } from '@/lib/types/category';
import { FoamType, FoamDimension, DimensionType } from '@/lib/types/foam';
import { getFoamTypes } from '@/lib/data/foam';
import { getDimensionRules, calculateRoundedValue } from '@/lib/data/dimension-rules';
import { DimensionRule } from '@/lib/types/dimension-rules';
import { getFibreWraps } from '@/lib/data/fibre-wrap';
import { FibreWrap } from '@/lib/types/fibre-wrap';
import { getFoamGrades } from '@/lib/data/foam-grades';
import { FoamGrade } from '@/lib/types/foam-grade';

interface FoamPageClientProps {
  categories: Category[];
}

export default function FoamPageClient({ categories }: FoamPageClientProps) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [foamTypes, setFoamTypes] = useState<FoamType[]>([]);
  const [selectedType, setSelectedType] = useState<FoamType | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [dimensionRules, setDimensionRules] = useState<DimensionRule[]>([]);
  const [fibreWraps, setFibreWraps] = useState<FibreWrap[]>([]);
  const [selectedWrapId, setSelectedWrapId] = useState<string>('');
  const [wrapEnabled, setWrapEnabled] = useState<boolean>(false);
  const [foamGrades, setFoamGrades] = useState<FoamGrade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');

  // Fetch dimension rules and fibre wraps on component mount
  useEffect(() => {
    getDimensionRules()
      .then((rules) => {
        setDimensionRules(rules);
      })
      .catch((error) => {
        console.error('Error fetching dimension rules:', error);
      });

    getFibreWraps()
      .then((wraps) => {
        setFibreWraps(wraps);
      })
      .catch((error) => {
        console.error('Error fetching fibre wraps:', error);
      });

    getFoamGrades()
      .then((grades) => {
        console.log('Fetched foam grades:', grades);
        console.log('Number of grades:', grades?.length || 0);
        setFoamGrades(grades || []);
      })
      .catch((error) => {
        console.error('Error fetching foam grades:', error);
        setFoamGrades([]);
      });
  }, []);

  // Fetch foam types when category is selected
  useEffect(() => {
    if (selectedCategoryId) {
      setLoading(true);
      getFoamTypes(selectedCategoryId)
        .then((types) => {
          setFoamTypes(types);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching foam types:', error);
          setLoading(false);
        });
    } else {
      setFoamTypes([]);
      setSelectedTypeId('');
      setSelectedType(null);
    }
  }, [selectedCategoryId]);

  // Update selected type and dimensions when type is selected
  useEffect(() => {
    if (selectedTypeId && foamTypes.length > 0) {
      const type = foamTypes.find((t) => t.id === selectedTypeId);
      if (type) {
        setSelectedType(type);
        // Initialize dimensions with default values from the type (no auto-fixing)
        const initialDimensions: Record<string, number> = {};
        type.dimensions.forEach((dim) => {
          initialDimensions[dim.name] = dim.value;
        });
        setDimensions(initialDimensions);
      }
    } else {
      setSelectedType(null);
      setDimensions({});
    }
  }, [selectedTypeId, foamTypes]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedTypeId('');
    setSelectedType(null);
    setDimensions({});
    setSelectedWrapId('');
    setWrapEnabled(false);
    setSelectedGradeId('');
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedTypeId(typeId);
  };

  const getRuleForDimension = (dimensionType: DimensionType): DimensionRule | null => {
    return dimensionRules.find((rule) => rule.dimensionType === dimensionType) || null;
  };

  const handleDimensionChange = (dimensionName: string, value: number, dimensionType: DimensionType) => {
    // Don't auto-fix, just store the value as entered
    console.log('handleDimensionChange called:', { dimensionName, value, dimensionType });
    setDimensions((prev) => {
      const newDimensions = {
        ...prev,
        [dimensionName]: value,
      };
      console.log('Updated dimensions:', newDimensions);
      return newDimensions;
    });
  };

  const validateDimensionValue = (value: number, dimensionType: DimensionType): string | null => {
    const rule = getRuleForDimension(dimensionType);
    if (!rule) return null;

    const warnings: string[] = [];

    // Check min/max constraints
    if (rule.minValue !== undefined && value < rule.minValue) {
      warnings.push(`Minimum value is ${rule.minValue} inch`);
    }
    if (rule.maxValue !== undefined && value > rule.maxValue) {
      warnings.push(`Maximum value is ${rule.maxValue} inch`);
    }

    // Check fraction rule
    if (!rule.allowFractions && value % 1 !== 0) {
      warnings.push('Fractions are not allowed. Please enter a whole number.');
    }

    return warnings.length > 0 ? warnings.join('. ') : null;
  };

  const calculateVolume = (): { volume: number; totalPrice: number | null; wrapPrice: number | null; thickness: number; depth: number; width: number } | null => {
    if (!selectedType) {
      return null;
    }

    // Group dimensions by type and find max value for each type using user-entered values
    const thicknessValues: number[] = [];
    const depthValues: number[] = [];
    const widthValues: number[] = [];

    selectedType.dimensions.forEach((dim) => {
      // Get the actual user-entered value from the dimensions state
      // Try exact match first, then case-insensitive match
      let userValue = dimensions[dim.name];
      if (userValue === undefined) {
        // Try case-insensitive match
        const matchingKey = Object.keys(dimensions).find(
          key => key.toLowerCase() === dim.name.toLowerCase()
        );
        if (matchingKey) {
          userValue = dimensions[matchingKey];
        }
      }
      
      console.log(`Checking dimension: name="${dim.name}", type="${dim.type}", userValue=${userValue}, all keys:`, Object.keys(dimensions));
      
      // Include if it's a valid number greater than 0
      if (userValue !== undefined && userValue !== null && !isNaN(userValue) && userValue > 0) {
        console.log(`Processing dimension: type="${dim.type}", value=${userValue}, type check:`, {
          isThickness: dim.type === 'thickness',
          isDepth: dim.type === 'depth',
          isWidth: dim.type === 'width',
        });
        
        // Normalize type for comparison (handle case and whitespace)
        const normalizedType = String(dim.type).toLowerCase().trim();
        
        // Handle both 'depth' and 'length' as depth (some types use 'length' instead of 'depth')
        if (normalizedType === 'thickness') {
          thicknessValues.push(userValue);
          console.log(`Added to thicknessValues: ${userValue}`);
        } else if (normalizedType === 'depth' || normalizedType === 'length') {
          depthValues.push(userValue);
          console.log(`Added to depthValues: ${userValue} (type: ${dim.type}, normalized: ${normalizedType})`);
        } else if (normalizedType === 'width') {
          widthValues.push(userValue);
          console.log(`Added to widthValues: ${userValue}`);
        } else {
          console.warn(`Unknown dimension type: "${dim.type}" (normalized: "${normalizedType}") for dimension "${dim.name}"`);
        }
      } else {
        console.log(`Skipping dimension "${dim.name}": userValue=${userValue}, valid=${userValue !== undefined && userValue !== null && !isNaN(userValue) && userValue > 0}`);
      }
    });

    console.log('Dimensions state:', dimensions);
    console.log('Selected type dimensions:', selectedType.dimensions);

    // Get max value for each type (use 0 if no values found)
    const maxThickness = thicknessValues.length > 0 ? Math.max(...thicknessValues) : 0;
    const maxDepth = depthValues.length > 0 ? Math.max(...depthValues) : 0;
    const maxWidth = widthValues.length > 0 ? Math.max(...widthValues) : 0;

    console.log('Calculation debug:', {
      dimensions,
      thicknessValues,
      depthValues,
      widthValues,
      maxThickness,
      maxDepth,
      maxWidth,
    });

    // If any dimension is missing (0), return null to show "enter dimensions" message
    if (maxThickness === 0 || maxDepth === 0 || maxWidth === 0) {
      return null;
    }

    // Apply rounding rules
    const thicknessRule = getRuleForDimension('thickness');
    const depthRule = getRuleForDimension('depth');
    const widthRule = getRuleForDimension('width');

    const roundedThickness = calculateRoundedValue(maxThickness, thicknessRule);
    const roundedDepth = calculateRoundedValue(maxDepth, depthRule);
    const roundedWidth = calculateRoundedValue(maxWidth, widthRule);

    // Calculate: (Thickness × Depth × Width) / 144
    const volume = (roundedThickness * roundedDepth * roundedWidth) / 144;
    
    // Calculate total price: volume × grade price (if grade is selected)
    const selectedGrade = foamGrades.find((g) => g.id === selectedGradeId);
    const totalPrice = selectedGrade ? volume * selectedGrade.price : null;
    
    // Calculate wrap price: wrap value × volume
    // If wrap is enabled: calculate price (or 0 if no wrap selected)
    // If wrap is disabled: show 0
    let wrapPrice: number | null = null;
    if (wrapEnabled) {
      const selectedWrap = selectedWrapId ? fibreWraps.find((w) => w.id === selectedWrapId) : null;
      wrapPrice = selectedWrap ? selectedWrap.value * volume : 0;
    } else {
      wrapPrice = 0;
    }
    
    return {
      volume,
      totalPrice,
      wrapPrice,
      thickness: roundedThickness,
      depth: roundedDepth,
      width: roundedWidth,
    };
  };

  const handleNext = () => {
    if (activeStep === 0 && selectedCategoryId && selectedTypeId) {
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setActiveStep(0);
    }
  };

  const steps = ['Choose Category & Type', 'Enter Dimensions'];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            JL Comfort
          </Typography>
          <Button color="inherit" component={Link} href="/">
            Home
          </Button>
          <Button color="inherit" component={Link} href="/admin">
            Admin
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Foam
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select your foam category, type, and dimensions
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Step 1: Category & Type Selection */}
        {activeStep === 0 && (
          <Box>
            {/* Category Selection */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Choose Foam Category
              </Typography>
              <Grid container spacing={3}>
                {categories.map((category) => (
                  <Grid item xs={12} sm={6} md={4} key={category.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedCategoryId === category.id ? 2 : 1,
                        borderColor:
                          selectedCategoryId === category.id
                            ? 'primary.main'
                            : 'divider',
                        '&:hover': {
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      <CardContent>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {category.name}
                        </Typography>
                        {category.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {category.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Type Selection */}
            {selectedCategoryId && (
              <Box>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  Choose Foam Type
                </Typography>
                {loading ? (
                  <Typography>Loading foam types...</Typography>
                ) : foamTypes.length === 0 ? (
                  <Typography color="text.secondary">
                    No foam types available for this category.
                  </Typography>
                ) : (
                  <>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      {foamTypes.map((type) => (
                        <Grid item xs={12} sm={6} md={4} key={type.id}>
                          <Card
                            sx={{
                              cursor: 'pointer',
                              border: selectedTypeId === type.id ? 2 : 1,
                              borderColor:
                                selectedTypeId === type.id
                                  ? 'primary.main'
                                  : 'divider',
                              '&:hover': {
                                boxShadow: 4,
                              },
                            }}
                            onClick={() => handleTypeChange(type.id)}
                          >
                            <CardContent>
                              <Typography variant="h6" component="h3" gutterBottom>
                                {type.name}
                              </Typography>
                              {type.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}
                                >
                                  {type.description}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    {selectedTypeId && (
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={!selectedCategoryId || !selectedTypeId}
                        >
                          Next
                        </Button>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Step 2: Dimensions Input */}
        {activeStep === 1 && selectedType && (
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Enter Dimensions
              </Typography>
              <Grid container spacing={4}>
                {/* Left Column: Product Info */}
                <Grid item xs={12} md={5}>
                  <Box sx={{ position: 'sticky', top: 20 }}>
                    <Card variant="outlined">
                      {selectedType.imageUrl ? (
                        <CardMedia
                          component="img"
                          image={selectedType.imageUrl}
                          alt={selectedType.name}
                          sx={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: 400,
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <CardMedia
                          component="div"
                          sx={{
                            height: 300,
                            backgroundColor: 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography color="text.secondary">
                            No Image Available
                          </Typography>
                        </CardMedia>
                      )}
                      <CardContent>
                        <Typography variant="h4" component="h2" gutterBottom>
                          {selectedType.name}
                        </Typography>
                        {selectedType.description && (
                          <>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                              {selectedType.description}
                            </Typography>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>

                {/* Right Column: Dimensions */}
                <Grid item xs={12} md={7}>
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                      Customize Dimensions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {selectedType.dimensions.map((dimension, index) => {
                        const rule = getRuleForDimension(dimension.type);
                        const minValue = rule?.minValue ?? 0;
                        const maxValue = rule?.maxValue;
                        const allowFractions = rule?.allowFractions ?? true;
                        const step = allowFractions ? 0.1 : 1;
                        const currentValue = dimensions[dimension.name] || 0;
                        const warningMessage = validateDimensionValue(currentValue, dimension.type);
                        const hasError = warningMessage !== null;
                        
                        // Get the letter shortcut if assigned in admin
                        const shortcutLetter = dimension.letterShortcut?.trim().toUpperCase() || null;

                        return (
                          <Box key={dimension.name}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {dimension.name}
                              </Typography>
                              {shortcutLetter && (
                                <Chip 
                                  label={shortcutLetter} 
                                  size="small" 
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    backgroundColor: 'primary.light',
                                    color: 'primary.dark'
                                  }} 
                                />
                              )}
                            </Box>
                            <TextField
                              type="number"
                              placeholder={dimension.name}
                              value={dimensions[dimension.name] ?? ''}
                              onChange={(e) => {
                                const inputStr = e.target.value;
                                console.log('TextField onChange:', { name: dimension.name, inputStr });
                                
                                if (inputStr === '' || inputStr === '-') {
                                  // Store 0 for empty fields
                                  handleDimensionChange(dimension.name, 0, dimension.type);
                                } else {
                                  const inputValue = parseFloat(inputStr);
                                  if (!isNaN(inputValue)) {
                                    handleDimensionChange(dimension.name, inputValue, dimension.type);
                                  } else {
                                    // Invalid input, store 0
                                    handleDimensionChange(dimension.name, 0, dimension.type);
                                  }
                                }
                              }}
                              inputProps={{
                                step,
                                min: minValue,
                                max: maxValue,
                              }}
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Typography variant="body2" color="text.secondary">
                                      Inch
                                    </Typography>
                                  </InputAdornment>
                                ),
                              }}
                              error={hasError}
                              helperText={warningMessage || ''}
                              sx={{
                                width: 250,
                              }}
                            />
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Wrap Selection */}
                    <Box sx={{ mt: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          Select Wrap
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={wrapEnabled}
                              onChange={(e) => {
                                setWrapEnabled(e.target.checked);
                                if (!e.target.checked) {
                                  setSelectedWrapId('');
                                }
                              }}
                            />
                          }
                          label={wrapEnabled ? 'Wrap Enabled' : 'Wrap Disabled'}
                        />
                      </Box>
                      {wrapEnabled && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                          {fibreWraps.map((wrap) => (
                            <Tooltip key={wrap.id} title={wrap.fibreThickness} arrow>
                              <Chip
                                icon={
                                  selectedWrapId === wrap.id ? (
                                    <CheckCircleIcon />
                                  ) : (
                                    <CircleIcon />
                                  )
                                }
                                label={wrap.fibreThickness}
                                onClick={() => setSelectedWrapId(wrap.id)}
                                color={selectedWrapId === wrap.id ? 'primary' : 'default'}
                                variant={selectedWrapId === wrap.id ? 'filled' : 'outlined'}
                                sx={{
                                  cursor: 'pointer',
                                  '&:hover': {
                                    boxShadow: 2,
                                  },
                                }}
                              />
                            </Tooltip>
                          ))}
                        </Box>
                      )}
                    </Box>

                    {/* Grade Selection */}
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                        Select Grade
                      </Typography>
                      {foamGrades.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No foam grades available. Please add grades in the admin panel.
                        </Typography>
                      ) : (
                        <FormControl sx={{ width: 250 }}>
                          <InputLabel id="grade-select-label">Foam Grade</InputLabel>
                          <Select
                            labelId="grade-select-label"
                            id="grade-select"
                            value={selectedGradeId}
                            label="Foam Grade"
                            onChange={(e) => setSelectedGradeId(e.target.value)}
                          >
                            {foamGrades.map((grade) => (
                              <MenuItem key={grade.id} value={grade.id}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <span>{grade.brand} - {grade.gradeName}</span>
                                  <span style={{ marginLeft: '16px', color: 'text.secondary' }}>
                                    ${grade.price.toFixed(2)}
                                  </span>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Box>

                    {/* Calculation Display */}
                    <Box sx={{ mt: 4, p: 2, bgcolor: 'primary.light', border: 1, borderColor: 'primary.main', borderRadius: 1 }}>
                      {(() => {
                        const result = calculateVolume();
                        console.log('Display render - result:', result);
                        if (result === null) {
                          return (
                            <>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                Calculation
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Please enter all dimensions (Thickness, Depth, Width) to calculate volume
                              </Typography>
                            </>
                          );
                        }
                        console.log('Rendering calculation box with volume:', result.volume);
                        return (
                          <>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                              Calculation
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.dark', mb: 1 }}>
                              Volume: {result.volume.toFixed(2)} cubic feet
                            </Typography>
                            {result.totalPrice !== null ? (
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
                                Foam Price: ${result.totalPrice.toFixed(2)}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Select a grade to calculate foam price
                              </Typography>
                            )}
                            {result.wrapPrice !== null && (
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 0.5 }}>
                                Wrap Price: ${result.wrapPrice.toFixed(2)}
                              </Typography>
                            )}
                            {wrapEnabled && selectedWrapId === '' && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Select a wrap to calculate wrap price
                              </Typography>
                            )}
                            {(() => {
                              const foamPrice = result.totalPrice || 0;
                              const wrapPriceValue = result.wrapPrice || 0;
                              const grandTotal = foamPrice + wrapPriceValue;
                              return grandTotal > 0 ? (
                                <Box sx={{ mt: 2, pt: 2, borderTop: 2, borderColor: 'primary.main' }}>
                                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                                    Total: ${grandTotal.toFixed(2)}
                                  </Typography>
                                </Box>
                              ) : null;
                            })()}
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              {result.thickness.toFixed(2)} × {result.depth.toFixed(2)} × {result.width.toFixed(2)} inches
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Foam: ((Thickness × Depth × Width) / 144) × Grade Price
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Wrap: Wrap Value × ((Thickness × Depth × Width) / 144)
                            </Typography>
                          </>
                        );
                      })()}
                    </Box>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={handleBack}>
                  Back
                </Button>
                <Button variant="contained" disabled>
                  Continue (Coming Soon)
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>
    </>
  );
}
