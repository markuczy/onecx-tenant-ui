import { Action, Store, StoreModule } from '@ngrx/store';
import { Observable, combineLatest, of } from 'rxjs';
import { provideMockActions } from '@ngrx/effects/testing';
import { cold, hot } from 'jest-marbles';
import { TenantSearchEffects } from './tenant-search.effects';
import {
  SearchConfigBffService,
  TenantBffService,
  TenantSearchResponse,
} from 'src/app/shared/generated';
import { TestBed, getTestBed } from '@angular/core/testing';
import { TenantService } from 'src/app/shared/services/tenant.service';
import { TenantSearchActions } from './tenant-search.actions';
import { TenantApiActions } from 'src/app/shared/actions/tenant-api.actions';
import {
  ActivatedRoute,
  Router,
  RouterModule,
  convertToParamMap,
} from '@angular/router';
import {
  PortalDialogService,
  PortalMessageService,
} from '@onecx/portal-integration-angular';
import {
  MockStore,
  createMockStore,
  provideMockStore,
} from '@ngrx/store/testing';
import { Actions } from '@ngrx/effects';
import { tenantSearchSelectors } from './tenant-search.selectors';
import { ROUTER_NAVIGATED } from '@ngrx/router-store';
import { TenantSearchComponent } from './tenant-search.component';
import * as utils from '@onecx/portal-integration-angular/ngrx';

describe('TenantSearchEffects:', () => {
  let activatedRouteMock: Partial<ActivatedRoute>;
  const mockedTenantService: Partial<TenantBffService> = {
    searchTenants: jest.fn(),
  };
  const mockedSearchConfigService: Partial<SearchConfigBffService> = {
    getSearchConfigInfos: jest.fn(),
    getSearchConfig: jest.fn(),
    createSearchConfig: jest.fn(),
  };
  let mockedRouter: Partial<Router> = {
    events: of({} as any),
  };
  let store: MockStore;
  const initialState = {};
  const mockedMessageService: Partial<PortalMessageService> = {
    error: jest.fn(),
  };
  const mockedDialogService: Partial<PortalDialogService> = {
    openDialog: jest.fn(),
  };

  // const mockSuccessSearchResponse: TenantSearchResponse = {
  //   totalElements: 1,
  //   stream: [
  //     {
  //       orgId: 'asdf_1',
  //       modificationCount: 1,
  //       id: 1,
  //     },
  //   ],
  // };

  const initEffects = (actions: Actions) => {
    return new TenantSearchEffects(
      actions,
      activatedRouteMock as ActivatedRoute,
      mockedTenantService as TenantBffService,
      mockedSearchConfigService as SearchConfigBffService,
      mockedRouter as Router,
      store,
      mockedMessageService as PortalMessageService,
      mockedDialogService as PortalDialogService
    );
  };

  beforeEach(() => {
    jest.resetAllMocks();
    store = createMockStore({ initialState });
  });

  it('should display error when TenantSearchActions.tenantSearchResultsLoadingFailed dispatched', (done) => {
    const actions = of(
      TenantSearchActions.tenantSearchResultsLoadingFailed({
        error: null,
      })
    );

    let effects = initEffects(actions);

    effects.displayError$.subscribe(() => {
      expect(mockedMessageService.error).toHaveBeenLastCalledWith({
        summaryKey:
          'TENANT_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED',
      });
      done();
    });
  });

  it('should display error when TenantSearchActions.searchConfigCreationFailed dispatched', (done) => {
    const actions = of(
      TenantSearchActions.searchConfigCreationFailed({
        error: null,
      })
    );

    let effects = initEffects(actions);

    effects.displayError$.subscribe(() => {
      expect(mockedMessageService.error).toHaveBeenLastCalledWith({
        summaryKey:
          'TENANT_SEARCH.ERROR_MESSAGES.SEARCH_CONFIG_CREATION_FAILED',
      });
      done();
    });
  });

  it('should display error when TenantSearchActions.searchConfigUpdateFailed dispatched', (done) => {
    const actions = of(
      TenantSearchActions.searchConfigUpdateFailed({
        error: null,
      })
    );

    let effects = initEffects(actions);

    effects.displayError$.subscribe(() => {
      expect(mockedMessageService.error).toHaveBeenLastCalledWith({
        summaryKey: 'TENANT_SEARCH.ERROR_MESSAGES.SEARCH_CONFIG_UPDATE_FAILED',
      });
      done();
    });
  });

  it('should not display error when action without error mapping dispatched', (done) => {
    // any not mapped action
    const actions = of(TenantSearchActions.chartVisibilityToggled());

    let effects = initEffects(actions);

    effects.displayError$.subscribe(() => {
      expect(mockedMessageService.error).toHaveBeenCalledTimes(0);
      done();
    });
  });

  it('should save visible: true to localStorage when TenantSearchActions.chartVisibilityToggled dispatched', (done) => {
    jest.spyOn(Storage.prototype, 'setItem');

    store.overrideSelector(tenantSearchSelectors.selectChartVisible, true);
    const actions = of(TenantSearchActions.chartVisibilityToggled());

    let effects = initEffects(actions);

    effects.saveChartVisibility$.subscribe(() => {
      expect(localStorage.setItem).toHaveBeenLastCalledWith(
        'tenantChartVisibility',
        'true'
      );
      done();
    });
  });

  it('should save visible: false to localStorage when TenantSearchActions.chartVisibilityToggled dispatched', (done) => {
    jest.spyOn(Storage.prototype, 'setItem');

    store.overrideSelector(tenantSearchSelectors.selectChartVisible, false);
    const actions = of(TenantSearchActions.chartVisibilityToggled());

    let effects = initEffects(actions);

    effects.saveChartVisibility$.subscribe(() => {
      expect(localStorage.setItem).toHaveBeenLastCalledWith(
        'tenantChartVisibility',
        'false'
      );
      done();
    });
  });

  it('should dispatch TenantSearchActions.chartVisibilityRehydrated with visible: true on TenantSearchComponent route change', (done) => {
    // navigation to TenantSearchComponent
    jest
      .spyOn(utils, 'filterForNavigatedTo')
      .mockReturnValue((source) => source.pipe());
    // router path changed
    jest
      .spyOn(utils, 'filterOutOnlyQueryParamsChanged')
      .mockReturnValue((source) => source.pipe());
    let localStorageSpy = jest.spyOn(Storage.prototype, 'getItem');
    localStorageSpy.mockReturnValue('true');
    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    };
    const actions = of(routerNavigatedAction);

    let effects = initEffects(actions);

    effects.rehydrateChartVisibility$.subscribe((action) => {
      expect(action.visible).toBe(true);
      done();
    });
  });

  it('should dispatch TenantSearchActions.chartVisibilityRehydrated with visible: false on TenantSearchComponent route change', (done) => {
    // navigation to TenantSearchComponent
    jest
      .spyOn(utils, 'filterForNavigatedTo')
      .mockReturnValue((source) => source.pipe());
    // router path changed
    jest
      .spyOn(utils, 'filterOutOnlyQueryParamsChanged')
      .mockReturnValue((source) => source.pipe());
    let localStorageSpy = jest.spyOn(Storage.prototype, 'getItem');
    localStorageSpy.mockReturnValue('false');
    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    };
    const actions = of(routerNavigatedAction);

    let effects = initEffects(actions);

    effects.rehydrateChartVisibility$.subscribe((action) => {
      expect(action.visible).toBe(false);
      done();
    });
  });

  it('should dispatch TenantSearchActions.searchConfigInfosReceived with fetched configs on TenantSearchComponent route change', (done) => {
    // navigation to TenantSearchComponent
    jest
      .spyOn(utils, 'filterForNavigatedTo')
      .mockReturnValue((source) => source.pipe());
    // router path changed
    jest
      .spyOn(utils, 'filterOutOnlyQueryParamsChanged')
      .mockReturnValue((source) => source.pipe());
    jest
      .spyOn(mockedSearchConfigService, 'getSearchConfigInfos')
      .mockReturnValue(
        of({
          configs: [
            { id: '1', name: 'config_1' },
            { id: '2', name: 'config_2' },
          ],
        } as any)
      );
    const routerNavigatedAction = {
      type: ROUTER_NAVIGATED,
    };
    const actions = of(routerNavigatedAction);

    let effects = initEffects(actions);

    effects.loadSearchConfigInfos$.subscribe((action) => {
      expect(action.searchConfigInfos).toEqual([
        { id: '1', name: 'config_1' },
        { id: '2', name: 'config_2' },
      ]);
      done();
    });
  });

  // it('TenantSearchActions.searchButtonClicked should dispatch TenantApiActions.tenantsReceived with the results', () => {
  //   const actions = hot('-a', {
  //     a: TenantSearchActions.searchButtonClicked({
  //       searchCriteria: { orgId: '' },
  //     }),
  //   });
  //   // console.log(ACTIONS____, TestBed.inject(Actions));
  //   // let effects = TestBed.inject(TenantSearchEffects);

  //   let effects = initEffects(actions);

  //   jest
  //     .spyOn(mockedTenantService, 'searchTenants')
  //     .mockReturnValue(cold('--a', { a: mockSuccessSearchResponse }));

  //   const expected = hot('---a', {
  //     a: TenantApiActions.tenantSearchResultsReceived({
  //       results: [
  //         {
  //           modificationCount: 1,
  //           id: 1,
  //           orgId: 'asdf_1',
  //         },
  //       ],
  //       totalElements: 1
  //     }),
  //   });
  // //   expect(mockedTenantService.searchTenants).toHaveBeenCalledTimes(1);
  //   expect(effects.searchByUrl$).toBe(expected);
  // });
});
