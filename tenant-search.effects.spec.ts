import { Action, Store, StoreModule } from @ngrx/store;
import { Observable, of } from rxjs;
import { provideMockActions } from @ngrx/effects/testing;
import { cold, hot } from jest-marbles;
import { TenantSearchEffects } from ./tenant-search.effects;
import {
  SearchConfigBffService,
  TenantBffService,
  TenantSearchResponse,
} from src/app/shared/generated;
import { TestBed, getTestBed } from @angular/core/testing;
import { TenantService } from src/app/shared/services/tenant.service;
import { TenantSearchActions } from ./tenant-search.actions;
import { TenantApiActions } from src/app/shared/actions/tenant-api.actions;
import {
  ActivatedRoute,
  Router,
  RouterModule,
  convertToParamMap,
} from @angular/router;
import { HttpClientTestingModule } from @angular/common/http/testing;
import { RouterTestingModule } from @angular/router/testing;
import {
  PortalDialogService,
  PortalMessageService,
} from @onecx/portal-integration-angular;
import { INJECTOR, Injector } from @angular/core;
import {
  MockStore,
  createMockStore,
  provideMockStore,
} from @ngrx/store/testing;
import { Actions, EffectsModule } from @ngrx/effects;
import { DOCUMENT } from @angular/common;
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from @angular/platform-browser-dynamic/testing;

describe(TenantSearchEffects:, () => {
  const mockedTenantService: Partial<TenantBffService> = {
    searchTenants: jest.fn(),
  };
  const mockedSearchConfigService: Partial<SearchConfigBffService> = {};
  const mockSuccessSearchResponse: TenantSearchResponse = {
    totalElements: 1,
    stream: [
      {
        orgId: asdf_1,
        modificationCount: 1,
        id: 1,
      },
    ],
  };

  let activatedRouteMock: Partial<ActivatedRoute> = {
    paramMap: of(convertToParamMap({ id: 1 })),
  };
  let mockedRouter: Partial<Router> = {
    events: of({} as any),
  };

  let store: MockStore;
  const initialState = {};

  const initEffects = (actions: Actions) => {
    return new TenantSearchEffects(
      actions,
      activatedRouteMock as ActivatedRoute,
      mockedTenantService as TenantBffService,
      mockedSearchConfigService as SearchConfigBffService,
      mockedRouter as Router,
      store,
      {} as PortalMessageService,
      {} as PortalDialogService
    );
  };

  beforeEach(() => {
    store = createMockStore({ initialState });
  });

  it(test, async () => {
    console.log(TESTSTART____);
    const actions = hot(-a, {
      a: TenantSearchActions.selectedSearchConfigInfo({
        searchConfigInfo: { id: 1, name: asd },
      }),
    });
    console.log(ACTIONSSET____);

    let effects = initEffects(actions);

    console.log(EFFECTSCREATED____);

    const expected = hot(-a, {
      a: TenantSearchActions.tenantSearchResultsReceived({
        results: [],
        totalElements: 0,
      }),
    });

    expect(effects!.tmp$).toBeObservable(expected);
  });

  it(TenantSearchActions.searchButtonClicked should dispatch TenantApiActions.tenantsReceived with the results, () => {
    console.log(TESTSTART____);
    const actions = hot(-a, {
      a: TenantSearchActions.searchButtonClicked({
        searchCriteria: { orgId:  },
      }),
    });
    // console.log(ACTIONS____, TestBed.inject(Actions));
    // let effects = TestBed.inject(TenantSearchEffects);
    console.log(ACTIONSSET____);

    let effects = initEffects(actions);

    jest
      .spyOn(mockedTenantService, searchTenants)
      .mockReturnValue(cold(--a, { a: mockSuccessSearchResponse }));

    const expected = hot(---a, {
      a: TenantApiActions.tenantsReceived({
        stream: [
          {
            modificationCount: 1,
            id: 1,
            orgId: asdf_1,
          },
        ],
      }),
    });
    expect(mockedTenantService.searchTenants).toHaveBeenCalledTimes(1);
    expect(effects.searchByUrl$).toBe(expected);
  });
});

//   describe(TenantSearchActions.searchClicked, () => {
//     it(should dispatch TenantApiActions.tenantsReceived with the results, () => {
//       actions$ = hot(-a, {
//         a: TenantSearchActions.searchButtonClicked({ searchCriteria: {orgId: }}),
//       });

//       mockedTenantService.search.mockReturnValue(
//         cold(--a, { a: mockSuccessSearchResponse })
//       );

//       const expected = hot(---a, {
//         a: TenantApiActions.tenantsReceived({
//           stream: [{
//             modificationCount:1,
//             id:1,
//             orgId: asdf_1 }],
//         }),
//       });
//       expect(effects.searchByUrl$).toBe(expected);
//     });

//     it(should dispatch TenantApiActions.tenantsReceived with empty results when response is empty, () => {
//       actions$ = hot(-a, {
//         a: TenantSearchActions.searchButtonClicked({ searchCriteria: {orgId: 1}}),
//       });

//       mockedTenantService.search.mockReturnValue(
//         cold(--a, { a: mockEmptySearchResponse })
//       );

//       const expected = hot(---a, {
//         a: TenantApiActions.tenantsReceived({
//           stream: [],
//         }),
//       });
//       expect(effects.searchByUrl$).toBe(expected);
//     });

//     it(should not call the service when query is empty, () => {
//       actions$ = hot(-a, {
//         a: TenantSearchActions.searchButtonClicked({ searchCriteria: {orgId: }}),
//       });

//       const expected = hot(---);
//       expect(effects.searchByUrl$).toBe(expected);
//       expect(mockedTenantService.search).not.toHaveBeenCalled();
//     });

//     it(should dispatch TenantApiActions.tenantSearchResultsLoadingFailed when there is an error calling the service, () => {
//       actions$ = hot(-a, {
//         a: TenantSearchActions.searchButtonClicked({ searchCriteria: {orgId: 1}}),
//       });

//       mockedTenantService.search.mockReturnValue(cold(--#));

//       const expected = hot(---a, {
//         a: TenantApiActions.tenantLoadingFailed({
//           error: error,
//         }),
//       });
//       expect(effects.searchByUrl$).toBe(expected);
//     });
//   });

