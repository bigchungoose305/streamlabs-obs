import TsxComponent from 'components/tsx-component';
import ModalLayout from 'components/ModalLayout.vue';
import { $t } from 'services/i18n';
import { Component, Watch } from 'vue-property-decorator';
import PlatformLogo from 'components/shared/PlatformLogo';
import styles from './GoLive.m.less';
import { Inject } from 'services/core';
import { UserService } from 'services/user';
import { getPlatformService, TPlatform } from 'services/platforms';
import { BoolInput, ToggleInput } from 'components/shared/inputs/inputs';
import cx from 'classnames';
import { formMetadata, IListOption, metadata } from 'components/shared/inputs';
import { SettingsService } from 'services/settings';
import HFormGroup from '../../shared/inputs/HFormGroup.vue';
import { WindowsService } from 'services/windows';
import { IGoLiveSettings, StreamingService } from 'services/streaming';

import cloneDeep from 'lodash/cloneDeep';
import { StreamSettingsService } from '../../../services/settings/streaming';
import ValidatedForm from '../../shared/inputs/ValidatedForm';
import GoLiveChecklist from './GoLiveChecklist';
import PlatformSettings from './PlatformSettings';

/**
 * Allows to update stream setting while being live
 **/
@Component({})
export default class EditStreamWindow extends TsxComponent<{}> {
  @Inject() private userService: UserService;
  @Inject() private settingsService: SettingsService;
  @Inject() private streamingService: StreamingService;
  @Inject() private streamSettingsService: StreamSettingsService;
  @Inject() private windowsService: WindowsService;

  $refs: {
    form: ValidatedForm;
  };

  private settings: IGoLiveSettings = null;

  private get view() {
    return this.streamingService.views;
  }

  private async submit() {
    const errors = await this.$refs.form.validateAndGetErrorsCount();
    if (errors) return;
    await this.streamingService.actions.return.updateStreamSettings(this.settings);
    this.$toasted.success($t('Successfully updated'), {
      position: 'bottom-center',
      duration: 1000,
      singleton: true,
    });
  }

  private goBack() {
    this.streamingService.actions.showEditStream();
  }

  private close() {
    this.windowsService.actions.closeChildWindow();
  }

  private render() {
    // create a copy of current settings model if not exist
    if (!this.settings) this.settings = cloneDeep(this.streamingService.views.goLiveSettings);

    const lifecycle = this.view.info.lifecycle;
    const shouldShowSettings = lifecycle === 'live';
    const shouldShowChecklist = lifecycle === 'runChecklist';
    return (
      <ModalLayout customControls={true} showControls={false}>
        <ValidatedForm ref="form" slot="content">
          {shouldShowSettings && <PlatformSettings vModel={this.settings} />}
          <BoolInput vModel={this.settings.useOptimizedProfile} />
          {shouldShowChecklist && <GoLiveChecklist />}
        </ValidatedForm>
        <div slot="controls">{this.renderControls()}</div>
      </ModalLayout>
    );
  }

  private switchAdvancedMode(advancedMode: boolean) {
    this.settings.advancedMode = advancedMode;
    this.streamSettingsService.actions.setGoLiveSettings({ advancedMode });
  }

  private renderControls() {
    const lifecycle = this.view.info.lifecycle;
    const loading = lifecycle !== 'live';
    const shouldShowGoBackButton = loading && this.view.info.error;
    const advancedMode = this.view.goLiveSettings.advancedMode;

    return (
      <div class="controls" style={{ display: 'flex', 'flex-direction': 'row-reverse' }}>
        {/* UPDATE BUTTON */}
        <button
          class={cx('button button--action', styles.goLiveButton)}
          onClick={() => this.submit()}
        >
          {$t('Update')}
        </button>

        {/* GO BACK BUTTON */}
        {shouldShowGoBackButton && (
          <button
            class={cx('button button--action', styles.goLiveButton)}
            onClick={() => this.goBack()}
          >
            {$t('Go back')}
          </button>
        )}

        {/* CLOSE BUTTON */}
        <button
          onClick={() => this.close()}
          class={cx('button button--default', styles.cancelButton)}
        >
          {$t('Close')}
        </button>

        {/* ADVANCED MODE SWITCHER */}
        {!loading && (
          <div class={styles.modeToggle}>
            <HFormGroup
              onInput={(val: boolean) => this.switchAdvancedMode(val)}
              value={advancedMode}
              metadata={metadata.toggle({ title: $t('Advanced Mode') })}
            />
          </div>
        )}
      </div>
    );
  }
}