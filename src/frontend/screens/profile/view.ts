/* Copyright (C) 2018-2020 The Manyverse Authors.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import {Stream} from 'xstream';
import dropRepeatsByKeys from 'xstream-drop-repeats-by-keys';
import {h} from '@cycle/react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {FloatingAction} from 'react-native-floating-action';
import {isRootPostMsg, isPublic} from 'ssb-typescript/utils';
import {SSBSource} from '../../drivers/ssb';
import {displayName} from '../../ssb/utils/from-ssb';
import {Palette} from '../../global-styles/palette';
import {Dimensions} from '../../global-styles/dimens';
import Feed from '../../components/Feed';
import Button from '../../components/Button';
import ToggleButton from '../../components/ToggleButton';
import EmptySection from '../../components/EmptySection';
import Avatar from '../../components/Avatar';
import TopBar from '../../components/TopBar';
import {styles, avatarSize} from './styles';
import {State} from './model';

export default function view(state$: Stream<State>, ssbSource: SSBSource) {
  return state$
    .compose(
      dropRepeatsByKeys([
        'displayFeedId',
        'selfFeedId',
        'about',
        'getFeedReadable',
        'getSelfRootsReadable',
      ]),
    )
    .map(state => {
      const isSelfProfile = state.displayFeedId === state.selfFeedId;
      const isBlocked = state.about.following === false;
      const followsYouTristate = state.about.followsYou;

      return h(View, {style: styles.container}, [
        h(TopBar, {sel: 'topbar'}),

        h(View, {style: styles.cover}, [
          h(
            Text,
            {
              style: styles.name,
              numberOfLines: 1,
              ellipsizeMode: 'middle',
              accessible: true,
              accessibilityLabel: 'Profile Name',
            },
            displayName(state.about.name, state.about.id),
          ),
        ]),

        h(
          TouchableWithoutFeedback,
          {
            sel: 'avatar',
            accessible: true,
            accessibilityLabel: 'Profile Picture',
          },
          [
            h(
              View,
              {style: styles.avatarTouchable, pointerEvents: 'box-only'},
              [
                h(Avatar, {
                  size: avatarSize,
                  url: state.about.imageUrl,
                  style: styles.avatar,
                }),
              ],
            ),
          ],
        ),

        h(View, {style: styles.sub}, [
          followsYouTristate === true
            ? h(View, {style: styles.followsYou}, [
                h(Text, {style: styles.followsYouText}, 'Follows you'),
              ])
            : followsYouTristate === false
            ? h(View, {style: styles.followsYou}, [
                h(Text, {style: styles.followsYouText}, 'Blocks you'),
              ])
            : null,

          h(View, {style: styles.cta}, [
            isSelfProfile
              ? null
              : h(
                  TouchableOpacity,
                  {
                    sel: 'manage',
                    accessible: true,
                    accessibilityLabel: 'Manage Contact',
                  },
                  [
                    h(Icon, {
                      size: Dimensions.iconSizeNormal,
                      color: Palette.textVeryWeak,
                      name: 'chevron-down',
                    }),
                  ],
                ),

            isSelfProfile
              ? h(Button, {
                  sel: 'editProfile',
                  text: 'Edit profile',
                  accessible: true,
                  accessibilityLabel: 'Edit Profile Button',
                })
              : isBlocked
              ? null
              : h(ToggleButton, {
                  sel: 'follow',
                  style: styles.follow,
                  text: state.about.following === true ? 'Following' : 'Follow',
                  toggled: state.about.following === true,
                }),
          ]),
        ]),

        h(View, {style: styles.descriptionArea}, [
          state.about.description
            ? h(Button, {
                sel: 'bio',
                text: 'Bio',
                small: true,
                style: styles.bioButton,
                accessible: true,
                accessibilityLabel: 'Biography Button',
                strong: false,
              })
            : null,
        ]),

        isBlocked
          ? h(EmptySection, {
              style: styles.emptySection,
              title: 'Blocked',
              description:
                'You have chosen to stop\ninteracting with this account',
            })
          : h(Feed, {
              sel: 'feed',
              getReadable: state.getFeedReadable,
              getPublicationsReadable: isSelfProfile
                ? state.getSelfRootsReadable
                : null,
              publication$: isSelfProfile
                ? ssbSource.publishHook$.filter(isPublic).filter(isRootPostMsg)
                : null,
              selfFeedId: state.selfFeedId,
              style: isSelfProfile ? styles.feedWithHeader : styles.feed,
              EmptyComponent: isSelfProfile
                ? h(EmptySection, {
                    style: styles.emptySection,
                    image: require('../../../../images/noun-plant.png'),
                    title: 'No messages',
                    description:
                      'Write a diary which you can\nshare with friends later',
                  })
                : h(EmptySection, {
                    style: styles.emptySection,
                    title: 'No messages',
                    description:
                      "You don't yet have any data\nfrom this account",
                  }),
            }),

        isSelfProfile
          ? h(FloatingAction, {
              sel: 'fab',
              color: Palette.backgroundCTA,
              visible: isSelfProfile,
              actions: [
                {
                  color: Palette.backgroundCTA,
                  name: 'compose',
                  icon: require('../../../../images/pencil.png'),
                  text: 'Write a public message',
                },
              ],
              overrideWithAction: true,
              iconHeight: 24,
              iconWidth: 24,
            })
          : null,
      ]);
    });
}
