import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';

import { colors, radius } from '../theme';
import FaIcon from './Icon';
import { playUiSound } from './sound';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';

export type SidePanelSide = 'left' | 'right';

type Props = {
  visible: boolean;
  side?: SidePanelSide;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
};

export default function SidePanel({
  visible,
  side = 'right',
  title,
  onClose,
  children,
  width = 360,
}: Props) {
  const [rendered, setRendered] = useState(visible);
  const translateX = useRef(new Animated.Value(side === 'right' ? width : -width)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0.45,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
      playUiSound('open', 0.4);
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: side === 'right' ? width : -width,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!rendered) return null;

  const isLeft = side === 'left';

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={[styles.root, isLeft ? styles.rootLeft : styles.rootRight]}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              playUiSound('close', 0.4);
              onClose();
            }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            isLeft ? styles.sheetLeft : styles.sheetRight,
            { width, transform: [{ translateX }] },
          ]}
        >
          <BlurView intensity={70} tint="dark" style={styles.sheetBlur}>
            <View style={styles.sheetInner}>
              <View style={styles.handle} />
              {title ? (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  <Pressable
                    onPress={() => {
                      playUiSound('close', 0.4);
                      onClose();
                    }}
                    style={styles.closeButton}
                    hitSlop={8}
                    accessibilityLabel="Close"
                  >
                    <FaIcon icon={faXmark} size={18} color={colors.textPrimary} />
                  </Pressable>
                </View>
              ) : null}

              <Animated.View style={{ opacity: contentOpacity, flex: 1 }}>
                {children}
              </Animated.View>
            </View>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
  },
  rootLeft: {
    justifyContent: 'flex-start',
  },
  rootRight: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: '#000000',
  },
  sheet: {
    height: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  sheetLeft: {
    borderTopRightRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    borderLeftWidth: 0,
  },
  sheetRight: {
    borderTopLeftRadius: radius.xxl,
    borderBottomLeftRadius: radius.xxl,
    borderRightWidth: 0,
  },
  sheetBlur: {
    flex: 1,
    backgroundColor: 'rgba(15, 20, 16, 0.75)',
  },
  sheetInner: {
    backgroundColor: 'rgba(15, 20, 16, 0.62)',
    flex: 1,
    paddingBottom: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
});
