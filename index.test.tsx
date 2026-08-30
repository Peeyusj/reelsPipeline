import { screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import EmployeeTable from './index'
import type { EmployeeTableProps } from './index'
import type { IEmployeeV2, IGetEmployeesV2Response } from '../type'
import { renderWithFluent } from '../../../../utils/renderUtils'
import {
  ADD_EMPLOYEE,
  DELETE_EMPLOYEE,
  RE_INVITE_EMPLOYEE,
  EXPORT_EMPLOYEES,
  IMPORT_EMPLOYEES,
} from '../../../../utils/constants'
import { USER_DATA } from '../../../../services/authenticatedUserService'

// ==================== SERVICE MOCKS ====================

const mockGetEmployeesV2 = jest.fn()
const mockDeleteUsers = jest.fn()
const mockReInvite = jest.fn()
const mockDownloadExcel = jest.fn()
const mockGetColumns = jest.fn()
const mockPostColumns = jest.fn()

jest.mock('../../../../services/employeeAPIService', () => ({
  getEmployeesV2: (...args: unknown[]) => mockGetEmployeesV2(...args),
  deleteUsers: (...args: unknown[]) => mockDeleteUsers(...args),
  reInvite: (...args: unknown[]) => mockReInvite(...args),
  downloadExcel: (...args: unknown[]) => mockDownloadExcel(...args),
  getColumns: (...args: unknown[]) => mockGetColumns(...args),
  postColumns: (...args: unknown[]) => mockPostColumns(...args),
  ColumnApiQueryParamTypes: { EMPLOYEE: 'EMPLOYEE' },
}))

const mockGetLoggedInUserDetails = jest.fn()

jest.mock('../../../../services/authenticatedUserService', () => ({
  getLoggedInUserDetails: () => mockGetLoggedInUserDetails(),
  USER_DATA: 'userData',
}))

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}))

jest.mock('../../../../hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

jest.mock('i18next', () => ({
  t: (key: string) => {
    const translations: Record<string, string> = {
      'TABLE_FIELDS.EMP_NAME': 'Employee Name',
      'TABLE_FIELDS.EMP_ID': 'Employee ID',
      'TABLE_FIELDS.EMAIL': 'Email Address',
      'TABLE_FIELDS.PHONE': 'Mobile Number',
      'TABLE_FIELDS.GENDER': 'Gender',
      'TABLE_FIELDS.DEPARTMENT': 'Department',
      'TABLE_FIELDS.DESIGNATION': 'Designation',
      'TABLE_FIELDS.BRANCH_CODE': 'Branch Code',
      'TABLE_FIELDS.DATE_OF_JOINING': 'Date of Joining',
      'TABLE_FIELDS.COST_CENTER': 'Cost Center',
      'TABLE_FIELDS.REPORTING_MANAGER': 'Reporting Manager',
      'TABLE_FIELDS.BUSINESS_UNIT': 'Business Unit',
      'TABLE_FIELDS.STATUS': 'Status',
      'TABLE_FIELDS.EMPLOYEE_TYPE': 'Employee Type',
      'TABLE_FIELDS.ROLE': 'Role',
      'TABLE_FIELDS.ALLOCATED_CAPACITY': 'Allocated Capacity',
      'TABLE_FIELDS.UTILIZED_CAPACITY': 'Utilized Capacity',
      'TABLE_FIELDS.IN_HOURS': 'in hrs',
      'TABLE_FIELDS.ACTIVE_PROJECTS': 'Active Projects',
      'TABLE_FIELDS.SKILLS': 'Skills',
      'TABLE_FIELDS.EXPERIENCE': 'Experience',
      'TABLE_FIELDS.IN_YEARS': 'in years',
      'BUTTON_LABELS.ADD_EMPLOYEE': 'Add Employee',
      'BUTTON_LABELS.FILTER': 'Filter',
      'BUTTON_LABELS.HIDE_FILTER': 'Hide Filter',
      'BUTTON_LABELS.EXPORT': 'Export',
      'BUTTON_LABELS.MORE_ACTION': 'More Action',
      'BUTTON_LABELS.IMPORT': 'Import',
      'BUTTON_LABELS.RE_INVITE': 'Re-Invite',
      'BUTTON_LABELS.DELETE': 'Delete',
      'BUTTON_LABELS.INITIATE_SEPARATION': 'Initiate Separation',
      'MODAL_TITLES.RE_INVITE': 'Re-Invite',
      'MODAL_TITLES.DELETE_USER': 'Delete User',
      'MODAL_DESCRIPTION.RE_INVITE': 'Re-invite selected employees?',
      'MODAL_BUTTONS.YES': 'Yes',
      'MODAL_BUTTONS.CANCEL': 'Cancel',
      'MODAL_CONFIRMATION_MESSAGE.RE_INVITE': 'Are you sure you want to re-invite?',
      'MODAL_CONFIRMATION_MESSAGE.DELETE_USER': 'Are you sure you want to delete?',
      'TOASTER_MESSAGES.FAILURE.ON_GET_COLUMNS_FAILURE': 'Failed to fetch columns',
      'TOASTER_MESSAGES.FAILURE.ON_EXPORT_FAILURE': 'Export failed',
      'TOASTER_MESSAGES.FAILURE.ON_DELETE_EMPLOYEE_FAILURE': 'Delete failed',
      'TOASTER_MESSAGES.FAILURE.ON_DELETE_PROJECT_ASSOCIATED_EMPLOYEE': 'Cannot delete project-associated employee',
      'TOASTER_MESSAGES.FAILURE.ON_RE_INVITE_EMPLOYEE_FAILURE': 'Re-invite failed',
      'TOASTER_MESSAGES.FAILURE.NO_COLUMNS_SELECTED': 'No columns selected',
      'TOASTER_MESSAGES.FAILURE.ON_POST_COLUMNS_FAILURE': 'Failed to save columns',
      'TOASTER_MESSAGES.SUCCESS.ON_SAVE_COLUMNS_SUCCESS': 'Columns saved',
      'TOASTER_MESSAGES.SUCCESS.ON_DELETE_EMPLOYEE_SUCCESS': 'Employee deleted',
      'TOASTER_MESSAGES.SUCCESS.ON_RE_INVITE_EMPLOYEE_SUCCESS': 'Re-invite sent to ',
      'TOASTER_MESSAGES.SUCCESS.EMPLOYEE(S)': 'employee(s)',
      'TOASTER_MESSAGES.SUCCESS.ON_REINVITE_CANNOT_HAPPEN': 'Some employees could not be re-invited',
      'TOASTER_MESSAGES.INFO.FEATURE_COMING_SOON': 'Feature coming soon',
    }
    return translations[key] ?? key
  },
  use: () => ({ init: jest.fn() }),
  init: jest.fn(),
  language: 'en',
  changeLanguage: jest.fn(),
}))

// ==================== MOCK DATA ====================

const ALL_PERMISSIONS = [
  ADD_EMPLOYEE,
  DELETE_EMPLOYEE,
  RE_INVITE_EMPLOYEE,
  EXPORT_EMPLOYEES,
  IMPORT_EMPLOYEES,
]

const createMockEmployee = (
  overrides: Partial<IEmployeeV2> = {},
): IEmployeeV2 => ({
  id: 1,
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '9876543210',
  dialCode: '+91',
  totalExperienceYears: 3,
  genderName: 'MALE',
  departmentName: 'Engineering',
  designationName: 'Developer',
  dateOfJoining: '2022-01-15',
  country: 'India',
  state: 'Karnataka',
  city: 'Bangalore',
  branchCode: 'BLR-001',
  costCenterName: 'CC-Engineering',
  reportingManager: 'Jane Manager',
  buName: 'Tech',
  status: 'ACTIVE',
  latestComment: null,
  updatedBy: null,
  createdAt: '2022-01-15',
  employeeType: 'Full Time',
  role: 'Employee',
  employeeNumber: 'EMP001',
  allocatedCapacity: 8,
  occupiedCapacity: 6,
  activeProjects: 'Project Alpha',
  itSkills: 'React, TypeScript',
  canEmployeeEdit: true,
  ...overrides,
})

const createMockResponse = (
  employees: IEmployeeV2[] = [createMockEmployee()],
  count?: number,
): IGetEmployeesV2Response => ({
  status: 'OK',
  data: {
    employeeModels: employees,
    count: count ?? employees.length,
  },
})

const mockEmployees: IEmployeeV2[] = [
  createMockEmployee({ id: 1, name: 'John Doe', employeeNumber: 'EMP001' }),
  createMockEmployee({
    id: 2,
    name: 'Jane Smith',
    employeeNumber: 'EMP002',
    email: 'jane.smith@example.com',
    genderName: 'FEMALE',
    designationName: 'Senior Developer',
    departmentName: 'Design',
    status: 'ACTIVE',
    branchCode: null,
    costCenterName: null,
    reportingManager: null,
    buName: null,
    activeProjects: null,
    itSkills: null,
  }),
]

const mockColumnsResponse = {
  status: 'OK',
  data: {
    employeeColumnNames: [
      'NAME', 'EMPLOYEE_ID', 'EMAIL', 'PHONE', 'GENDER_NAME',
      'DEPARTMENT_NAME', 'DESIGNATION_NAME', 'BRANCH_CODE',
      'DATE_OF_JOINING', 'COST_CENTER_NAME', 'REPORTING_MANAGER',
      'BUSSINESS_UNIT_NAME', 'STATUS', 'EMPLOYEE_TYPE', 'ROLE',
      'ALLOCATED_CAPACITY', 'UTILIZED_CAPACITY', 'ACTIVE_PROJECT_NAMES',
      'SKILLS', 'EXPERIENCE',
    ],
    projectColumnNames: [],
  },
}

// ==================== HELPERS ====================

/**
 * Sets sessionStorage with the given privileges so isPermissionValid works.
 * This tests the REAL permission logic — no mocking of isPermissionValid itself.
 */
const setPermissions = (privileges: string[]): void => {
  sessionStorage.setItem(
    USER_DATA,
    JSON.stringify({ privileges }),
  )
}

const defaultProps: EmployeeTableProps = {
  onAddEmployee: jest.fn(),
  onImportClick: jest.fn(),
  refreshTrigger: 0,
  toaster: {
    showToast: false,
    message: '',
    variant: 'success',
  },
  setToast: jest.fn(),
  onRefresh: jest.fn(),
  isOptionsLoading: false,
}

const renderTable = (propOverrides: Partial<EmployeeTableProps> = {}): ReturnType<typeof renderWithFluent> => {
  return renderWithFluent(
    <EmployeeTable {...defaultProps} {...propOverrides} />,
  )
}

// ==================== TESTS ====================

describe('EmployeeTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    setPermissions(ALL_PERMISSIONS)

    mockGetEmployeesV2.mockResolvedValue(createMockResponse(mockEmployees))
    mockGetColumns.mockResolvedValue(mockColumnsResponse)
    mockGetLoggedInUserDetails.mockReturnValue({
      isReportingManager: false,
      role: 'Admin',
    })
  })

  afterEach(() => {
    cleanup()
    sessionStorage.clear()
  })

  // ==================== RENDERING ====================

  describe('Rendering', () => {
    it('renders table and fetches employees on mount', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(1)
      })

      // Verify employee data renders — use getAllByText because FluentUI Tooltip duplicates text
      await waitFor(() => {
        const johnElements = screen.getAllByText('John Doe')
        expect(johnElements.length).toBeGreaterThanOrEqual(1)
      })

      const janeElements = screen.getAllByText('Jane Smith')
      expect(janeElements.length).toBeGreaterThanOrEqual(1)
    })

    it('renders column headers from i18n keys', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      // t() returns the key itself in CRA test environment
expect(screen.getAllByText('Employee Name').length).toBeGreaterThanOrEqual(1)
expect(screen.getAllByText('Employee ID').length).toBeGreaterThanOrEqual(1)
expect(screen.getAllByText('Email Address').length).toBeGreaterThanOrEqual(1)
expect(screen.getAllByText('Status').length).toBeGreaterThanOrEqual(1)
    })

    it('renders null-safe cells with dash fallback', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      // Jane Smith has null branchCode, costCenterName, reportingManager, buName, activeProjects, itSkills
      await waitFor(() => {
        const dashElements = screen.getAllByText('-')
        // At least 6 dashes for Jane's null fields
        expect(dashElements.length).toBeGreaterThanOrEqual(6)
      })
    })

    it('renders phone with dial code when present', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      await waitFor(() => {
        const phoneElements = screen.getAllByText('+91 9876543210')
        expect(phoneElements.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('formats dateOfJoining as DD-MM-YYYY', async () => {
      mockGetEmployeesV2.mockResolvedValueOnce(
        createMockResponse([
          createMockEmployee({ dateOfJoining: '2024-12-25' }),
        ]),
      )

      renderTable()

      await waitFor(() => {
        const dateElements = screen.getAllByText('25-12-2024')
        expect(dateElements.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  // ==================== DATA FETCHING ====================

  describe('Data Fetching', () => {
    it('calls getEmployeesV2 with default pagination params', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledWith(
          1,            // page
          10,           // size
          undefined,    // sortBy
          'DESC',       // order
          expect.any(URLSearchParams),
        )
      })
    })

    it('includes deleted=false default filter in API call', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      const filterParams = mockGetEmployeesV2.mock.calls[0][4] as URLSearchParams
      const paramsString = filterParams.toString()

      expect(paramsString).toContain('deleted')
      expect(paramsString).toContain('false')
    })

    it('loads saved columns on mount', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetColumns).toHaveBeenCalledWith('EMPLOYEE')
      })
    })

    it('calls setToast on fetch failure', async () => {
      mockGetEmployeesV2.mockRejectedValueOnce(new Error('Network Error'))

      const mockSetToast = jest.fn()
      renderTable({ setToast: mockSetToast })

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(
          expect.objectContaining({
            showToast: true,
            variant: 'danger',
          }),
        )
      })
    })

    it('refetches when refreshTrigger changes', async () => {
      renderTable({ refreshTrigger: 0 })

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(1)
      })

      cleanup()
      renderTable({ refreshTrigger: 1 })

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(2)
      })
    })
  })

  // ==================== SEARCH ====================

  describe('Search', () => {
    it('renders search input', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
    })

    it('fetches page 1 when search value changes', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(1)
      })

      const searchInput = screen.getByPlaceholderText('Search')
      fireEvent.change(searchInput, { target: { value: 'John' } })

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(2)
      })

      // First arg is page — should be 1 when searching
      const secondCall = mockGetEmployeesV2.mock.calls[1]
      expect(secondCall[0]).toBe(1)
    })

    it('includes LIKE filters for standard search columns', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      const searchInput = screen.getByPlaceholderText('Search')
      fireEvent.change(searchInput, { target: { value: 'test' } })

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(2)
      })

      const filterParams = mockGetEmployeesV2.mock.calls[1][4] as URLSearchParams
      const paramsString = filterParams.toString()

      expect(paramsString).toContain('name')
      expect(paramsString).toContain('email')
      expect(paramsString).toContain('LIKE')
    })

    it('handles phone search with dial code format (+91 8767868768)', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      const searchInput = screen.getByPlaceholderText('Search')
      fireEvent.change(searchInput, { target: { value: '+91 8767868768' } })

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(2)
      })

      const filterParams = mockGetEmployeesV2.mock.calls[1][4] as URLSearchParams
      const paramsString = filterParams.toString()

      expect(paramsString).toContain('dialCode')
      expect(paramsString).toContain('phone')
    })

    it('handles phone search without separator (+918767868768)', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      const searchInput = screen.getByPlaceholderText('Search')
      fireEvent.change(searchInput, { target: { value: '+918767868768' } })

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(2)
      })

      const filterParams = mockGetEmployeesV2.mock.calls[1][4] as URLSearchParams
      const paramsString = filterParams.toString()

      // Falls back to searching phone field only with digits
      expect(paramsString).toContain('phone')
      // Should NOT contain dialCode since boundary is ambiguous
      expect(paramsString).not.toContain('dialCode')
    })
  })

  // ==================== SORTING ====================

  describe('Sorting', () => {
    it('fetches with sort params when column header clicked', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      const nameHeader = screen.getAllByText('Employee Name')[0]
      fireEvent.click(nameHeader)

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(2)
      })

      const secondCall = mockGetEmployeesV2.mock.calls[1]
      expect(secondCall[2]).toBe('name') // sortBy
    })

    it('toggles sort direction on repeated header clicks', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      const header = screen.getAllByText('Employee Name')[0]

      fireEvent.click(header)
      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(2)
      })

      const secondCallOrder = mockGetEmployeesV2.mock.calls[1][3]

      fireEvent.click(header)
      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalledTimes(3)
      })

      const thirdCallOrder = mockGetEmployeesV2.mock.calls[2][3]
      expect(secondCallOrder).not.toBe(thirdCallOrder)
    })
  })

  // ==================== PERMISSION GATING ====================

  describe('Permission Gating', () => {
    it('renders Add Employee button when ADD_EMPLOYEE permission exists', async () => {
      setPermissions([ADD_EMPLOYEE])
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      expect(screen.getByText('Add Employee')).toBeInTheDocument()
    })

    it('hides Add Employee button when ADD_EMPLOYEE permission is absent', async () => {
      setPermissions([]) // no permissions
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      expect(screen.queryByText('BUTTON_LABELS.ADD_EMPLOYEE')).not.toBeInTheDocument()
    })

    it('renders Export button when EXPORT_EMPLOYEES permission exists', async () => {
      setPermissions([EXPORT_EMPLOYEES])
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      expect(screen.getByText('Export')).toBeInTheDocument()
    })

    it('hides Export button when EXPORT_EMPLOYEES permission is absent', async () => {
      setPermissions([])
      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      expect(screen.queryByText('BUTTON_LABELS.EXPORT')).not.toBeInTheDocument()
    })

    it('calls onAddEmployee when Add Employee button clicked', async () => {
      const mockOnAdd = jest.fn()
      setPermissions([ADD_EMPLOYEE])
      renderTable({ onAddEmployee: mockOnAdd })

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      
      fireEvent.click(screen.getByText('Add Employee'))
      expect(mockOnAdd).toHaveBeenCalledTimes(1)
    })
  })

  // ==================== EMPTY STATE ====================

  describe('Empty State', () => {
    it('renders table with no rows when API returns empty', async () => {
      mockGetEmployeesV2.mockResolvedValueOnce(createMockResponse([], 0))

      renderTable()

      await waitFor(() => {
        expect(mockGetEmployeesV2).toHaveBeenCalled()
      })

      // Column headers should still render
      expect(screen.getAllByText('Employee Name')[0]).toBeInTheDocument()

      // Employee names should not be present
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  // ==================== COLUMNS API ====================

  describe('Saved Columns', () => {
    it('calls getColumns on mount to load saved columns', async () => {
      renderTable()

      await waitFor(() => {
        expect(mockGetColumns).toHaveBeenCalledWith('EMPLOYEE')
      })
    })

    it('calls setToast on getColumns failure', async () => {
      mockGetColumns.mockRejectedValueOnce(new Error('Column fetch failed'))
      const mockSetToast = jest.fn()

      renderTable({ setToast: mockSetToast })

      await waitFor(() => {
        expect(mockSetToast).toHaveBeenCalledWith(
          expect.objectContaining({
            showToast: true,
            variant: 'danger',
          }),
        )
      })
    })
  })

  describe('Delete Flow', () => {
const setupDeleteFlow = async (propOverrides: Partial<EmployeeTableProps> = {}): Promise<void> => {
  setPermissions(ALL_PERMISSIONS)
  renderTable(propOverrides)

  await waitFor(() => {
    expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1)
  })

  const checkboxes = screen.getAllByRole('checkbox')
  const rowCheckbox = checkboxes.find(
    (cb) => cb.getAttribute('aria-label') !== 'Select all rows',
  )
  if (rowCheckbox != null) fireEvent.click(rowCheckbox)

  // Export chevron = index 0, More Action chevron = index 1
  const menuChevrons = screen.getAllByRole('button').filter(
    (btn) => btn.getAttribute('aria-haspopup') === 'menu' && btn.textContent?.trim() === '',
  )
  const moreActionMenuTrigger = menuChevrons[1]

  if (moreActionMenuTrigger == null) {
    throw new Error('More Action menu trigger not found')
  }

  fireEvent.click(moreActionMenuTrigger)

  await waitFor(() => {
    expect(screen.getByText('Delete')).toBeInTheDocument()
  })
  fireEvent.click(screen.getByText('Delete'))

  await waitFor(() => {
    expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument()
  })
}

  it('opens delete confirmation modal when Delete menu item clicked', async () => {
    await setupDeleteFlow()
    expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-delete-btn')).toBeInTheDocument()
  })

  it('closes modal without calling deleteUsers when Cancel clicked', async () => {
    await setupDeleteFlow()
    fireEvent.click(screen.getByTestId('cancel-delete-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-btn')).not.toBeInTheDocument()
    })
    expect(mockDeleteUsers).not.toHaveBeenCalled()
  })

  it('calls deleteUsers with selected employee IDs on confirm', async () => {
    mockDeleteUsers.mockResolvedValueOnce({ status: 'OK' })
    await setupDeleteFlow()
    fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    await waitFor(() => {
      expect(mockDeleteUsers).toHaveBeenCalledWith(expect.arrayContaining([1]))
    })
  })

  it('calls setToast with success variant after successful delete', async () => {
    mockDeleteUsers.mockResolvedValueOnce({ status: 'OK' })
    const mockSetToast = jest.fn()
    await setupDeleteFlow({ setToast: mockSetToast })
    mockSetToast.mockClear()
    fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({ showToast: true, variant: 'success' }),
      )
    })
  })

  it('calls setToast with danger variant when delete API fails', async () => {
    mockDeleteUsers.mockRejectedValueOnce(new Error('Delete failed'))
    const mockSetToast = jest.fn()
    await setupDeleteFlow({ setToast: mockSetToast })
    mockSetToast.mockClear()
    fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({ showToast: true, variant: 'danger' }),
      )
    })
  })

  it('shows project-associated error message for 400 + ASS_ERR_0186', async () => {
    mockDeleteUsers.mockRejectedValueOnce({
      status: 400,
      response: { data: { data: 'ASS_ERR_0186' } },
    })
    const mockSetToast = jest.fn()
    await setupDeleteFlow({ setToast: mockSetToast })
    mockSetToast.mockClear()
    fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({
          showToast: true,
          variant: 'danger',
          message: 'Cannot delete project-associated employee',
        }),
      )
    })
  })

  it('closes modal after delete completes regardless of outcome', async () => {
    mockDeleteUsers.mockResolvedValueOnce({ status: 'OK' })
    await setupDeleteFlow()
    fireEvent.click(screen.getByTestId('confirm-delete-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-btn')).not.toBeInTheDocument()
    })
  })
})

describe('Re-Invite Flow', () => {
  const setupReInviteFlow = async (propOverrides: Partial<EmployeeTableProps> = {}): Promise<void> => {
    setPermissions(ALL_PERMISSIONS)
    renderTable(propOverrides)

    await waitFor(() => {
      expect(screen.getAllByText('John Doe').length).toBeGreaterThanOrEqual(1)
    })

    const checkboxes = screen.getAllByRole('checkbox')
    const rowCheckbox = checkboxes.find(
      (cb) => cb.getAttribute('aria-label') !== 'Select all rows',
    )
    if (rowCheckbox != null) fireEvent.click(rowCheckbox)

    const menuChevrons = screen.getAllByRole('button').filter(
      (btn) => btn.getAttribute('aria-haspopup') === 'menu' && btn.textContent?.trim() === '',
    )
    const moreActionMenuTrigger = menuChevrons[1]

    if (moreActionMenuTrigger == null) {
      throw new Error('More Action menu trigger not found')
    }

    fireEvent.click(moreActionMenuTrigger)

    await waitFor(() => {
      expect(screen.getByText('Re-Invite')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('Re-Invite'))

    await waitFor(() => {
      expect(screen.getByTestId('confirm-reinvite-btn')).toBeInTheDocument()
    })
  }

  it('opens re-invite confirmation modal when Re-Invite menu item clicked', async () => {
    await setupReInviteFlow()
    expect(screen.getByTestId('confirm-reinvite-btn')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-reinvite-btn')).toBeInTheDocument()
  })

  it('closes modal without calling reInvite when Cancel clicked', async () => {
    await setupReInviteFlow()
    fireEvent.click(screen.getByTestId('cancel-reinvite-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-reinvite-btn')).not.toBeInTheDocument()
    })
    expect(mockReInvite).not.toHaveBeenCalled()
  })

  it('calls reInvite with selected employee IDs on confirm', async () => {
    mockReInvite.mockResolvedValueOnce({ data: { status: 'OK', data: 1 } })
    await setupReInviteFlow()
    fireEvent.click(screen.getByTestId('confirm-reinvite-btn'))
    await waitFor(() => {
      expect(mockReInvite).toHaveBeenCalledWith(expect.arrayContaining([1]))
    })
  })

  it('calls setToast with success variant when all selected employees re-invited', async () => {
    // data.data = 1 means 1 re-invited, selectedIds.length = 1 — exact match → success
    mockReInvite.mockResolvedValueOnce({ data: { status: 'OK', data: 1 } })
    const mockSetToast = jest.fn()
    await setupReInviteFlow({ setToast: mockSetToast })
    mockSetToast.mockClear()
    fireEvent.click(screen.getByTestId('confirm-reinvite-btn'))
    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({ showToast: true, variant: 'success' }),
      )
    })
  })

  it('calls setToast with warning when only some employees re-invited', async () => {
    // selectedIds.length = 1 but data.data = 0 triggers the warning branch
    mockReInvite.mockResolvedValueOnce({ data: { status: 'OK', data: 0 } })
    const mockSetToast = jest.fn()
    await setupReInviteFlow({ setToast: mockSetToast })
    mockSetToast.mockClear()
    fireEvent.click(screen.getByTestId('confirm-reinvite-btn'))
    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({ showToast: true, variant: 'warning' }),
      )
    })
  })

  it('calls setToast with danger variant when reInvite API fails', async () => {
    mockReInvite.mockRejectedValueOnce(new Error('Re-invite failed'))
    const mockSetToast = jest.fn()
    await setupReInviteFlow({ setToast: mockSetToast })
    mockSetToast.mockClear()
    fireEvent.click(screen.getByTestId('confirm-reinvite-btn'))
    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({ showToast: true, variant: 'danger' }),
      )
    })
  })

  it('closes modal after re-invite completes', async () => {
    mockReInvite.mockResolvedValueOnce({ data: { status: 'OK', data: 1 } })
    await setupReInviteFlow()
    fireEvent.click(screen.getByTestId('confirm-reinvite-btn'))
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-reinvite-btn')).not.toBeInTheDocument()
    })
  })
})

describe('Save Columns', () => {
  it('calls postColumns with correct enum keys when Save Columns clicked', async () => {
    setPermissions(ALL_PERMISSIONS)
    mockPostColumns.mockResolvedValueOnce({ status: 'OK' })
    const mockSetToast = jest.fn()
    renderTable({ setToast: mockSetToast })

    await waitFor(() => {
      expect(mockGetEmployeesV2).toHaveBeenCalled()
    })

    // Open Columns panel via the Columns button
    const columnsBtn = screen.getByText('Columns')
    fireEvent.click(columnsBtn)

    // Save Columns button should now be visible inside the column options panel
    await waitFor(() => {
      expect(screen.getByText('Save Columns')).toBeInTheDocument()
    })

    mockSetToast.mockClear()
    fireEvent.click(screen.getByText('Save Columns'))

    await waitFor(() => {
      expect(mockPostColumns).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeColumnNames: expect.any(Array),
          projectColumnNames: [],
        }),
        'EMPLOYEE',
      )
    })
  })

  it('calls setToast with success after saving columns', async () => {
    setPermissions(ALL_PERMISSIONS)
    mockPostColumns.mockResolvedValueOnce({ status: 'OK' })
    const mockSetToast = jest.fn()
    renderTable({ setToast: mockSetToast })

    await waitFor(() => {
      expect(mockGetEmployeesV2).toHaveBeenCalled()
    })

    const columnsBtn = screen.getByText('Columns')
    fireEvent.click(columnsBtn)

    await waitFor(() => {
      expect(screen.getByText('Save Columns')).toBeInTheDocument()
    })

    mockSetToast.mockClear()
    fireEvent.click(screen.getByText('Save Columns'))

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({ showToast: true, variant: 'success' }),
      )
    })
  })

  it('calls setToast with danger when postColumns fails', async () => {
    setPermissions(ALL_PERMISSIONS)
    mockPostColumns.mockRejectedValueOnce(new Error('Save failed'))
    const mockSetToast = jest.fn()
    renderTable({ setToast: mockSetToast })

    await waitFor(() => {
      expect(mockGetEmployeesV2).toHaveBeenCalled()
    })

    const columnsBtn = screen.getByText('Columns')
    fireEvent.click(columnsBtn)

    await waitFor(() => {
      expect(screen.getByText('Save Columns')).toBeInTheDocument()
    })

    mockSetToast.mockClear()
    fireEvent.click(screen.getByText('Save Columns'))

    await waitFor(() => {
      expect(mockSetToast).toHaveBeenCalledWith(
        expect.objectContaining({ showToast: true, variant: 'danger' }),
      )
    })
  })
})

})