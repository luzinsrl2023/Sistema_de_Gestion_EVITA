import { useCallback, useMemo, useRef, useEffect, useState, useContext } from 'react';

/**
 * Hook para optimización de rendimiento con useCallback y useMemo
 * Proporciona funciones optimizadas para operaciones comunes
 */
export const usePerformanceOptimization = () => {
  // Memoizar funciones de debounce
  const debounceRef = useRef({});
  
  const debounce = useCallback((func, delay) => {
    return (...args) => {
      const key = func.name || 'anonymous';
      if (debounceRef.current[key]) {
        clearTimeout(debounceRef.current[key]);
      }
      debounceRef.current[key] = setTimeout(() => func(...args), delay);
    };
  }, []);

  // Memoizar función de throttle
  const throttleRef = useRef({});
  
  const throttle = useCallback((func, delay) => {
    return (...args) => {
      const key = func.name || 'anonymous';
      const now = Date.now();
      if (!throttleRef.current[key] || now - throttleRef.current[key] >= delay) {
        throttleRef.current[key] = now;
        func(...args);
      }
    };
  }, []);

  // Memoizar función de memoización de resultados
  const memoize = useCallback((func) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = func(...args);
      cache.set(key, result);
      return result;
    };
  }, []);

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      Object.values(debounceRef.current).forEach(clearTimeout);
      Object.values(throttleRef.current).forEach(clearTimeout);
    };
  }, []);

  return {
    debounce,
    throttle,
    memoize
  };
};

/**
 * Hook para optimización de listas grandes con virtualización
 */
export const useVirtualizedList = (items, itemHeight = 50, containerHeight = 400) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    
    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      top: (startIndex + index) * itemHeight
    }));
  }, [items, itemHeight, containerHeight, scrollTop]);

  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll
  };
};

/**
 * Hook para optimización de formularios con validación memoizada
 */
export const useOptimizedForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Memoizar función de validación
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return '';

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  }, [validationRules, values]);

  // Memoizar función de validación completa
  const validateForm = useCallback(() => {
    const newErrors = {};
    Object.keys(validationRules).forEach(field => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
      }
    });
    return newErrors;
  }, [values, validateField, validationRules]);

  // Memoizar función de cambio de campo
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validar en tiempo real si el campo ha sido tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Memoizar función de blur
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [values, validateField]);

  // Memoizar función de submit
  const handleSubmit = useCallback((onSubmit) => {
    return (e) => {
      e.preventDefault();
      const formErrors = validateForm();
      
      if (Object.keys(formErrors).length === 0) {
        onSubmit(values);
      } else {
        setErrors(formErrors);
        setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      }
    };
  }, [values, validateForm, validationRules]);

  // Memoizar estado de validez del formulario
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0 && Object.values(errors).every(error => !error);
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setValues,
    setErrors,
    setTouched
  };
};

/**
 * Hook para optimización de búsqueda con debounce
 */
export const useOptimizedSearch = (items, searchFields = [], debounceDelay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { debounce } = usePerformanceOptimization();

  // Memoizar función de búsqueda
  const searchItems = useCallback((term) => {
    if (!term.trim()) return items;

    const lowerTerm = term.toLowerCase();
    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(lowerTerm);
      });
    });
  }, [items, searchFields]);

  // Memoizar función de búsqueda con debounce
  const debouncedSearch = useMemo(() => {
    return debounce((term) => {
      setIsSearching(false);
    }, debounceDelay);
  }, [debounce, debounceDelay]);

  // Memoizar resultados de búsqueda
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    return searchItems(searchTerm);
  }, [items, searchTerm, searchItems]);

  // Memoizar función de cambio de término de búsqueda
  const handleSearchChange = useCallback((term) => {
    setSearchTerm(term);
    setIsSearching(true);
    debouncedSearch(term);
  }, [debouncedSearch]);

  return {
    searchTerm,
    filteredItems,
    isSearching,
    handleSearchChange,
    setSearchTerm
  };
};

/**
 * Hook para optimización de tablas con paginación memoizada
 */
export const useOptimizedTable = (data, pageSize = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Memoizar datos ordenados
  const sortedData = useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  // Memoizar datos paginados
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  // Memoizar información de paginación
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const totalItems = sortedData.length;
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return {
      currentPage,
      totalPages,
      totalItems,
      startItem,
      endItem,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [sortedData.length, currentPage, pageSize]);

  // Memoizar función de cambio de página
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Memoizar función de ordenamiento
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortField]);

  return {
    data: paginatedData,
    paginationInfo,
    handlePageChange,
    handleSort,
    sortField,
    sortDirection
  };
};

/**
 * Hook para optimización de efectos con cleanup automático
 */
export const useOptimizedEffect = (effect, deps) => {
  const cleanupRef = useRef();

  useEffect(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const cleanup = effect();
    cleanupRef.current = cleanup;

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, deps);
};

/**
 * Hook para optimización de contextos con memoización
 */
export const useOptimizedContext = (Context, selector) => {
  const context = useContext(Context);
  
  return useMemo(() => {
    if (selector) {
      return selector(context);
    }
    return context;
  }, [context, selector]);
};

export default {
  usePerformanceOptimization,
  useVirtualizedList,
  useOptimizedForm,
  useOptimizedSearch,
  useOptimizedTable,
  useOptimizedEffect,
  useOptimizedContext
};
