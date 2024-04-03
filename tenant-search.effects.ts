import { Injectable, SkipSelf, inject } from @angular/core;
import { ActivatedRoute, Router } from @angular/router;
import { Actions, concatLatestFrom, createEffect, ofType } from @ngrx/effects;
import { routerNavigatedAction } from @ngrx/router-store;
import { Action, Store } from @ngrx/store;
import {
  CreateOrEditSearchConfigDialogComponent,
  CreateOrEditSearchDialogContent,
  PortalDialogService,
  PortalMessageService,
} from @onecx/portal-integration-angular;
import {
  createQueryParamsEffect,
  filterForNavigatedTo,
  filterOutOnlyQueryParamsChanged,
  filterOutQueryParamsHaveNotChanged,
} from @onecx/portal-integration-angular/ngrx;
import { catchError, map, mergeMap, of, switchMap, tap } from rxjs;
import {
  CreateSearchConfigRequest,
  SearchConfigBffService,
  TenantBffService,
} from ../../../shared/generated;
import { TenantSearchActions } from ./tenant-search.actions;
import { TenantSearchComponent } from ./tenant-search.component;
import { tenantSearchCriteriasSchema } from ./tenant-search.parameters;
import {
  selectSearchConfigViewState,
  selectSearchCriteria,
  tenantSearchSelectors,
} from ./tenant-search.selectors;

@Injectable()
export class TenantSearchEffects {
  constructor(
    private actions$: Actions,
    @SkipSelf() private route: ActivatedRoute,
    private tenantService: TenantBffService,
    private searchConfigService: SearchConfigBffService,
    private router: Router,
    private store: Store,
    private messageService: PortalMessageService,
    private portalDialogService: PortalDialogService
  ) {}

  pageName = tenant;

  createSearchConfig$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TenantSearchActions.createSearchConfigClicked),
      mergeMap((action) => {
        return this.portalDialogService.openDialog(
          TENANT_SEARCH.HEADER_ACTIONS.CREATE_SEARCH_CONFIG,
          CreateOrEditSearchConfigDialogComponent,
          TENANT_SEARCH.HEADER_ACTIONS.DIALOG_CONFIRM,
          TENANT_SEARCH.HEADER_ACTIONS.DIALOG_CANCEL
        );
      }),
      concatLatestFrom(() => this.store.select(selectSearchConfigViewState)),
      switchMap(([dialogResult, viewState]) => {
        if (dialogResult.button === secondary) {
          return of(TenantSearchActions.searchConfigCreationCancelled());
        }
        let request: CreateSearchConfigRequest = {
          page: this.pageName ?? ,
          fieldListVersion: 0,
          name: dialogResult.result?.searchConfigName ?? ,
          isReadonly: false,
          isAdvanced: viewState.viewMode === advanced ?? false,
          columns: dialogResult.result?.saveColumns
            ? viewState.columns.map((c) => c.id)
            : [],
          values: dialogResult.result?.saveInputValues
            ? Object.fromEntries(
                Object.keys(viewState?.searchCriteria ?? {}).map((k) => [
                  k,
                  (viewState?.searchCriteria as Record<string, any>)[
                    k
                  ].toString(),
                ])
              )
            : {},
        };
        return this.searchConfigService.createSearchConfig(request).pipe(
          map(({ configs }) => {
            return TenantSearchActions.searchConfigCreatedSuccessfully({
              searchConfigInfos: configs,
            });
          })
        );
      }),

      catchError((error) =>
        of(
          TenantSearchActions.searchConfigCreationFailed({
            error,
          })
        )
      )
    );
  });

  updateSearchConfig$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TenantSearchActions.updateSearchConfigClicked),
      concatLatestFrom(() =>
        this.store.select(tenantSearchSelectors.selectSelectedSearchConfig)
      ),
      mergeMap(([, selectedSearchConfig]) => {
        return this.portalDialogService.openDialog<CreateOrEditSearchDialogContent>(
          CONSTRUCTION_TASK_SEARCH.HEADER_ACTIONS.UPDATE_SEARCH_CONFIG,
          {
            type: CreateOrEditSearchConfigDialogComponent,
            inputs: {
              searchConfigName: selectedSearchConfig?.name,
              saveInputValues:
                Object.keys(selectedSearchConfig?.values ?? {}).length > 0,
              saveColumns: (selectedSearchConfig?.columns ?? []).length > 0,
            },
          },
          TENANT_SEARCH.HEADER_ACTIONS.DIALOG_CONFIRM,
          TENANT_SEARCH.HEADER_ACTIONS.DIALOG_CANCEL
        );
      }),
      concatLatestFrom(() => this.store.select(selectSearchConfigViewState)),
      switchMap(([dialogResult, viewState]) => {
        if (dialogResult.button === secondary) {
          return of(TenantSearchActions.searchConfigUpdateCancelled());
        }
        let request: CreateSearchConfigRequest = {
          page: this.pageName ?? ,
          name: dialogResult.result?.searchConfigName ?? ,
          fieldListVersion: 0,
          isReadonly: false,
          isAdvanced: viewState.viewMode === advanced,
          columns: dialogResult.result?.saveColumns
            ? viewState.columns.map((c) => c.id)
            : [],
          values: dialogResult.result?.saveInputValues
            ? Object.fromEntries(
                Object.keys(viewState?.searchCriteria ?? {}).map((k) => [
                  k,
                  (viewState?.searchCriteria as Record<string, any>)[
                    k
                  ].toString(),
                ])
              )
            : {},
        };
        return this.searchConfigService.createSearchConfig(request).pipe(
          map(({ configs }) => {
            return TenantSearchActions.searchConfigUpdatedSuccessfully({
              searchConfigInfos: configs,
            });
          })
        );
      }),

      catchError((error) =>
        of(
          TenantSearchActions.searchConfigUpdateFailed({
            error,
          })
        )
      )
    );
  });

  searchConfigDeselected$ = createQueryParamsEffect(
    this.actions$,
    TenantSearchActions.searchConfigInfoDeselected,
    this.router,
    this.route,
    () => ({})
  );

  resetButtonClicked$ = createQueryParamsEffect(
    this.actions$,
    TenantSearchActions.resetButtonClicked,
    this.router,
    this.route,
    () => ({})
  );

  searchButtonClicked$ = createQueryParamsEffect(
    this.actions$,
    TenantSearchActions.searchButtonClicked,
    this.router,
    this.route,
    (state, action) => ({
      ...state,
      ...action.searchCriteria,
      //TODO: Move to docs to explain how to only put the date part in the URL in case you have date and not datetime
      //exampleDate: action.searchCriteria.exampleDate?.slice(0, 10)
    })
  );

  searchConfigReceived$ = createQueryParamsEffect(
    this.actions$,
    TenantSearchActions.searchConfigReceived,
    this.router,
    this.route,
    (state, action) => ({
      ...state,
      ...(action.searchConfig.values ?? {}),
    })
  );

  searchByUrl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, TenantSearchComponent),
      filterOutQueryParamsHaveNotChanged(
        this.router,
        tenantSearchCriteriasSchema,
        false
      ),
      concatLatestFrom(() => this.store.select(selectSearchCriteria)),
      switchMap(([, searchCriteria]) =>
        this.tenantService.searchTenants(searchCriteria).pipe(
          map(({ stream, totalElements }) =>
            TenantSearchActions.tenantSearchResultsReceived({
              results: stream,
              totalElements,
            })
          ),
          catchError((error) =>
            of(
              TenantSearchActions.tenantSearchResultsLoadingFailed({
                error,
              })
            )
          )
        )
      )
    );
  });

  tmp$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TenantSearchActions.selectedSearchConfigInfo),
      map(() => {
        return TenantSearchActions.tenantSearchResultsReceived({
          results: [],
          totalElements: 0,
        });
      })
    );
  });

  loadSearchConfig$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TenantSearchActions.selectedSearchConfigInfo),
      switchMap(({ searchConfigInfo }) =>
        this.searchConfigService.getSearchConfig(searchConfigInfo.id).pipe(
          map(({ config }) =>
            TenantSearchActions.searchConfigReceived({
              searchConfig: config,
            })
          ),
          catchError((error) =>
            of(
              TenantSearchActions.searchConfigsLoadingFailed({
                error,
              })
            )
          )
        )
      )
    );
  });

  loadSearchConfigInfos$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, TenantSearchComponent),
      filterOutOnlyQueryParamsChanged(this.router),
      switchMap(() =>
        this.searchConfigService.getSearchConfigInfos(tenant-search).pipe(
          map(({ configs }) =>
            TenantSearchActions.searchConfigInfosReceived({
              searchConfigInfos: configs,
            })
          )
        )
      )
    );
  });

  rehydrateChartVisibility$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, TenantSearchComponent),
      filterOutOnlyQueryParamsChanged(this.router),
      map(() =>
        TenantSearchActions.chartVisibilityRehydrated({
          visible: localStorage.getItem(tenantChartVisibility) === true,
        })
      )
    );
  });

  saveChartVisibility$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(TenantSearchActions.chartVisibilityToggled),
        concatLatestFrom(() =>
          this.store.select(tenantSearchSelectors.selectChartVisible)
        ),
        tap(([, chartVisible]) => {
          localStorage.setItem(tenantChartVisibility, String(chartVisible));
        })
      );
    },
    { dispatch: false }
  );

  errorMessages: { action: Action; key: string }[] = [
    {
      action: TenantSearchActions.tenantSearchResultsLoadingFailed,
      key: TENANT_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED,
    },
    {
      action: TenantSearchActions.searchConfigCreationFailed,
      key: TENANT_SEARCH.ERROR_MESSAGES.SEARCH_CONFIG_CREATION_FAILED,
    },
    {
      action: TenantSearchActions.searchConfigUpdateFailed,
      key: TENANT_SEARCH.ERROR_MESSAGES.SEARCH_CONFIG_UPDATE_FAILED,
    },
  ];

  displayError$ = createEffect(
    () => {
      return this.actions$.pipe(
        tap((action) => {
          const e = this.errorMessages.find(
            (e) => e.action.type === action.type
          );
          if (e) {
            this.messageService.error({ summaryKey: e.key });
          }
        })
      );
    },
    { dispatch: false }
  );
}

